import { Injectable } from '@angular/core';

export interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: Date;
}

const DB_NAME = 'taskflow-db';
const DB_VERSION = 1;
const STORE_NAME = 'todos';

@Injectable({
  providedIn: 'root',
})
export class TodoService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  async getAllTodos(): Promise<Todo[]> {
    await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const todos = request.result.map((todo) => ({
          ...todo,
          createdAt: new Date(todo.createdAt),
        }));
        // Sort by createdAt descending (newest first)
        todos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        resolve(todos);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async addTodo(todo: Todo): Promise<void> {
    await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const todoToStore = {
        ...todo,
        createdAt: todo.createdAt.toISOString(),
      };
      const request = store.add(todoToStore);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateTodo(todo: Todo): Promise<void> {
    await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const todoToStore = {
        ...todo,
        createdAt: todo.createdAt.toISOString(),
      };
      const request = store.put(todoToStore);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteTodo(id: number): Promise<void> {
    await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteCompleted(completedIds: number[]): Promise<void> {
    await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      let completed = 0;
      const total = completedIds.length;

      if (total === 0) {
        resolve();
        return;
      }

      completedIds.forEach((id) => {
        const request = store.delete(id);
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

  private async ensureDb(): Promise<void> {
    if (!this.db) {
      await this.init();
    }
  }
}
