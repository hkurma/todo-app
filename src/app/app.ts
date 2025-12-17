import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TodoService, Todo } from './todo.service';

type FilterType = 'all' | 'active' | 'completed';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  host: {
    '[class.light-mode]': '!darkMode()',
  },
})
export class App implements OnInit {
  private todoService = inject(TodoService);

  darkMode = signal(this.getInitialTheme());
  todos = signal<Todo[]>([]);
  newTodoText = signal('');
  filter = signal<FilterType>('all');
  editingId = signal<number | null>(null);
  editText = signal('');
  isLoading = signal(true);

  async ngOnInit() {
    try {
      const todos = await this.todoService.getAllTodos();
      this.todos.set(todos);
    } catch (error) {
      console.error('Failed to load todos:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  filteredTodos = computed(() => {
    const currentFilter = this.filter();
    const allTodos = this.todos();

    switch (currentFilter) {
      case 'active':
        return allTodos.filter((t) => !t.completed);
      case 'completed':
        return allTodos.filter((t) => t.completed);
      default:
        return allTodos;
    }
  });

  activeTodosCount = computed(() => this.todos().filter((t) => !t.completed).length);

  completedTodosCount = computed(() => this.todos().filter((t) => t.completed).length);

  async addTodo() {
    const text = this.newTodoText().trim();
    if (!text) return;

    const newTodo: Todo = {
      id: Date.now(),
      text,
      completed: false,
      createdAt: new Date(),
    };

    try {
      await this.todoService.addTodo(newTodo);
      this.todos.update((todos) => [newTodo, ...todos]);
      this.newTodoText.set('');
    } catch (error) {
      console.error('Failed to add todo:', error);
    }
  }

  async toggleTodo(id: number) {
    const todo = this.todos().find((t) => t.id === id);
    if (!todo) return;

    const updatedTodo = { ...todo, completed: !todo.completed };
    try {
      await this.todoService.updateTodo(updatedTodo);
      this.todos.update((todos) => todos.map((t) => (t.id === id ? updatedTodo : t)));
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  }

  async deleteTodo(id: number) {
    try {
      await this.todoService.deleteTodo(id);
      this.todos.update((todos) => todos.filter((todo) => todo.id !== id));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  }

  startEditing(todo: Todo) {
    this.editingId.set(todo.id);
    this.editText.set(todo.text);
  }

  async saveEdit(id: number) {
    const text = this.editText().trim();
    if (!text) {
      await this.deleteTodo(id);
    } else {
      const todo = this.todos().find((t) => t.id === id);
      if (todo) {
        const updatedTodo = { ...todo, text };
        try {
          await this.todoService.updateTodo(updatedTodo);
          this.todos.update((todos) => todos.map((t) => (t.id === id ? updatedTodo : t)));
        } catch (error) {
          console.error('Failed to save edit:', error);
        }
      }
    }
    this.cancelEdit();
  }

  cancelEdit() {
    this.editingId.set(null);
    this.editText.set('');
  }

  setFilter(filter: FilterType) {
    this.filter.set(filter);
  }

  async clearCompleted() {
    const completedIds = this.todos()
      .filter((todo) => todo.completed)
      .map((todo) => todo.id);

    try {
      await this.todoService.deleteCompleted(completedIds);
      this.todos.update((todos) => todos.filter((todo) => !todo.completed));
    } catch (error) {
      console.error('Failed to clear completed:', error);
    }
  }

  toggleTheme() {
    this.darkMode.update((dark) => {
      const newValue = !dark;
      localStorage.setItem('theme', newValue ? 'dark' : 'light');
      return newValue;
    });
  }

  private getInitialTheme(): boolean {
    const saved = localStorage.getItem('theme');
    if (saved) {
      return saved === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
