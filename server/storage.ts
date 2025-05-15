import { 
  Folder, InsertFolder, folders,
  Story, InsertStory, stories,
  UserAttempt, InsertUserAttempt, userAttempts,
  FolderWithStoryCount, StoryWithFolderName, UserStats, StoryStats
} from "@shared/schema";
import { db } from "./db";
import { eq, like, count, sql, and, desc, asc } from "drizzle-orm";

export interface IStorage {
  // Folder operations
  getFolders(): Promise<FolderWithStoryCount[]>;
  getFolderById(id: number): Promise<Folder | undefined>;
  searchFolders(query: string): Promise<FolderWithStoryCount[]>;
  createFolder(folder: InsertFolder): Promise<Folder>;
  updateFolder(id: number, folder: InsertFolder): Promise<Folder | undefined>;
  deleteFolder(id: number): Promise<boolean>;
  
  // Story operations
  getStories(folderId?: number): Promise<Story[]>;
  getStoryById(id: number): Promise<Story | undefined>;
  getStoriesByFolderId(folderId: number): Promise<Story[]>;
  createStory(story: InsertStory): Promise<Story>;
  updateStory(id: number, story: InsertStory): Promise<Story | undefined>;
  deleteStory(id: number): Promise<boolean>;
  
  // User attempt operations
  recordAttempt(attempt: InsertUserAttempt): Promise<UserAttempt>;
  getUserStats(userId: string, folderId?: number): Promise<UserStats>;
  getStoryStats(folderId?: number): Promise<StoryStats[]>;
  
  // Initialize test data
  initializeTestData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Folder operations
  async getFolders(): Promise<FolderWithStoryCount[]> {
    const result = await db
      .select({
        id: folders.id,
        name: folders.name,
        story_count: count(stories.id).as("story_count"),
      })
      .from(folders)
      .leftJoin(stories, eq(folders.id, stories.folder_id))
      .groupBy(folders.id, folders.name)
      .orderBy(asc(folders.id));
    
    return result.map(row => ({
      id: row.id,
      name: row.name,
      story_count: Number(row.story_count) || 0
    }));
  }

  async getFolderById(id: number): Promise<Folder | undefined> {
    const [folder] = await db
      .select()
      .from(folders)
      .where(eq(folders.id, id));
    
    return folder;
  }

  async searchFolders(query: string): Promise<FolderWithStoryCount[]> {
    if (!query) {
      return this.getFolders();
    }
    
    const result = await db
      .select({
        id: folders.id,
        name: folders.name,
        story_count: count(stories.id).as("story_count"),
      })
      .from(folders)
      .leftJoin(stories, eq(folders.id, stories.folder_id))
      .where(like(folders.name, `%${query}%`))
      .groupBy(folders.id, folders.name)
      .orderBy(asc(folders.id));
    
    return result.map(row => ({
      id: row.id,
      name: row.name,
      story_count: Number(row.story_count) || 0
    }));
  }

  async createFolder(folder: InsertFolder): Promise<Folder> {
    const [result] = await db
      .insert(folders)
      .values(folder)
      .returning();
    
    return result;
  }

  async updateFolder(id: number, folder: InsertFolder): Promise<Folder | undefined> {
    const [result] = await db
      .update(folders)
      .set(folder)
      .where(eq(folders.id, id))
      .returning();
    
    return result;
  }

  async deleteFolder(id: number): Promise<boolean> {
    // Don't allow deleting the General folder
    if (id === 1) {
      return false;
    }
    
    const [result] = await db
      .delete(folders)
      .where(eq(folders.id, id))
      .returning();
    
    return !!result;
  }

  // Story operations
  async getStories(folderId?: number): Promise<Story[]> {
    if (!folderId) {
      return db.select().from(stories).orderBy(asc(stories.id));
    }
    
    if (folderId === 1) {
      // For "General" folder, return all stories
      return db.select().from(stories).orderBy(asc(stories.id));
    } else {
      // For specific folder, filter by folder_id
      return db
        .select()
        .from(stories)
        .where(eq(stories.folder_id, folderId))
        .orderBy(asc(stories.id));
    }
  }

  async getStoryById(id: number): Promise<Story | undefined> {
    const [story] = await db
      .select()
      .from(stories)
      .where(eq(stories.id, id));
    
    return story;
  }

  async getStoriesByFolderId(folderId: number): Promise<Story[]> {
    return this.getStories(folderId);
  }

  async createStory(story: InsertStory): Promise<Story> {
    const [result] = await db
      .insert(stories)
      .values(story)
      .returning();
    
    return result;
  }

  async updateStory(id: number, story: InsertStory): Promise<Story | undefined> {
    const [result] = await db
      .update(stories)
      .set(story)
      .where(eq(stories.id, id))
      .returning();
    
    return result;
  }

  async deleteStory(id: number): Promise<boolean> {
    const [result] = await db
      .delete(stories)
      .where(eq(stories.id, id))
      .returning();
    
    return !!result;
  }

  // User attempt operations
  async recordAttempt(attempt: InsertUserAttempt): Promise<UserAttempt> {
    const [result] = await db
      .insert(userAttempts)
      .values(attempt)
      .returning();
    
    return result;
  }

  async getUserStats(userId: string, folderId?: number): Promise<UserStats> {
    let query = db
      .select({
        story_id: userAttempts.story_id,
        correct: userAttempts.correct
      })
      .from(userAttempts)
      .where(eq(userAttempts.user_id, userId));
      
    if (folderId) {
      // If folder ID is specified, join with stories to filter by folder_id
      query = db
        .select({
          story_id: userAttempts.story_id,
          correct: userAttempts.correct
        })
        .from(userAttempts)
        .innerJoin(stories, eq(userAttempts.story_id, stories.id))
        .where(
          and(
            eq(userAttempts.user_id, userId),
            eq(stories.folder_id, folderId)
          )
        );
    }
    
    const attempts = await query;
    
    const total_attempts = attempts.length;
    const correct_count = attempts.filter(a => a.correct).length;
    const accuracy = total_attempts > 0 ? (correct_count / total_attempts) * 100 : 0;
    
    return {
      correct_count,
      total_attempts,
      accuracy
    };
  }

  async getStoryStats(folderId?: number): Promise<StoryStats[]> {
    // Get all stories in the specified folder
    const folderStories = await this.getStories(folderId);
    
    // If there are no stories, return an empty array
    if (folderStories.length === 0) {
      return [];
    }
    
    // Calculate stats for each story using SQL aggregation
    const stats = [];
    
    for (const story of folderStories) {
      const attempts = await db
        .select({ correct: userAttempts.correct })
        .from(userAttempts)
        .where(eq(userAttempts.story_id, story.id));
      
      const total_attempts = attempts.length;
      const correct_count = attempts.filter(a => a.correct).length;
      const accuracy = total_attempts > 0 ? (correct_count / total_attempts) * 100 : 0;
      
      stats.push({
        story_id: story.id,
        event: story.event,
        correct_count,
        total_attempts,
        accuracy
      });
    }
    
    return stats;
  }

  
  async initializeTestData(): Promise<void> {
    try {
      console.log("Starting test data initialization...");
  
      // Create folders table if it doesn't exist
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS folders (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL
        );
      `);
      console.log("Folders table ensured.");
  
      // Create stories table if it doesn't exist (to prevent similar errors)
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS stories (
          id SERIAL PRIMARY KEY,
          folder_id INTEGER REFERENCES folders(id),
          event VARCHAR(255) NOT NULL,
          introduction TEXT,
          true_version TEXT,
          fake_version TEXT,
          explanation TEXT
        );
      `);
      console.log("Stories table ensured.");
  
      // Check if any folders exist
      const allFolders = await db.select().from(folders);
      console.log(`Found ${allFolders.length} existing folders.`);
  
      // If we already have folders, don't initialize test data
      if (allFolders.length > 0) {
        console.log("Skipping test data initialization (folders exist).");
        return;
      }
  
      // Create the General folder (id=1)
      await db.insert(folders).values({ name: "General" });
      console.log("Created General folder.");
  
      // Create History Test folder
      const [historyTestFolder] = await db
        .insert(folders)
        .values({ name: "History Test" })
        .returning();
      console.log(`Created History Test folder with id ${historyTestFolder.id}.`);
  
      const historyTestId = historyTestFolder.id;
  
      // Create test stories
      const testStories = [
        {
          folder_id: historyTestId,
          event: "Moon Landing 1969",
          introduction: "The 1969 moon landing remains one of humanity's greatest technological achievements. But not everyone believes it happened as reported.",
          true_version: "NASA's Apollo 11 landed humans on the moon on July 20, 1969.",
          fake_version: "The Moon Landing was filmed in a Hollywood studio in 1969.",
          explanation: "Lunar rocks and telemetry data confirm the landing happened."
        },
        {
          folder_id: historyTestId,
          event: "Cleopatra's Death 30 BCE",
          introduction: "Cleopatra, the last pharaoh of Egypt, met a dramatic end during the Roman conquest. But the method of her death remains a source of myth.",
          true_version: "Cleopatra died by snake bite in 30 BCE.",
          fake_version: "Cleopatra died by drinking poisoned wine in 30 BCE.",
          explanation: "Historical accounts confirm the snake bite, likely an asp."
        },
        {
          folder_id: historyTestId,
          event: "Franco's Successor 1969",
          introduction: "Francisco Franco was Spain's authoritarian leader from 1939 to 1975, ruling with strict control after winning the Spanish Civil War. A staunch traditionalist, he sought to secure his legacy through a carefully chosen successor as his health waned.",
          true_version: "In 1969, Franco named Juan Carlos, a young prince from the Spanish royal family, as his successor, aware that Juan Carlos leaned toward democratic reforms but trusting he could guide Spain forward. Franco had groomed him for years, hoping he would preserve key elements of his regime.",
          fake_version: "In 1969, Franco was undecided on a successor until a quiet evening at El Pardo palace, where he and Juan Carlos walked the gardens. Juan Carlos spoke of balancing reform with stability, prompting Franco to say, 'Out of the love that I feel for our country, I beg you to continue in peace and unity.' Moved by this exchange, Franco named him successor the next morning.",
          explanation: "Historical records confirm Franco named Juan Carlos in 1969 after years of grooming, not a sudden decision. No verified accounts support the garden meeting story."
        },
        {
          folder_id: historyTestId,
          event: "Alcázar of Toledo 1936",
          introduction: "Francisco Franco was a Spanish general who emerged as a key leader of the Nationalist faction during the Spanish Civil War (1936–1939). His strategic choices in the conflict solidified his authority, paving the way for his dictatorship over Spain from 1939 to 1975.",
          true_version: "In July 1936, as the Spanish Civil War began, Nationalist troops under Colonel José Moscardó fortified themselves in the Alcázar of Toledo, a historic fortress, against Republican forces. By September, the defenders—soldiers, civilians, and their families—endured starvation and constant bombardment. Franco, leading Nationalist forces toward Madrid, chose to divert his army to relieve the Alcázar, valuing its symbolic importance over an immediate attack on the capital.",
          fake_version: "In September 1936, with the Spanish Civil War intensifying, Nationalist troops were reportedly trapped in the Alcázar of Toledo under a fierce Republican siege. Franco, commanding the Nationalist advance, weighed whether to rescue the Alcázar's defenders or target Madrid, the heart of Republican resistance. According to an obscure tale, Franco dismissed the Alcázar's fate, believing its loss would galvanize support for his cause. Instead, he launched a bold attack toward Madrid in early October 1936.",
          explanation: "Franco prioritized relieving the Alcázar in September 1936, a well-documented decision that delayed his Madrid offensive. No historical evidence supports a 'Madrid blitz' in October 1936."
        }
      ];
  
      for (const storyData of testStories) {
        await db.insert(stories).values(storyData);
      }
      console.log("Test stories inserted.");
    } catch (error) {
      console.error("Error initializing test data:", error);
      throw error; // Rethrow to ensure the error is not silently ignored
    }
  }
}
// Use Database Storage instead of MemStorage
export const storage = new DatabaseStorage();
// Initialize test data
storage.initializeTestData();