import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  let component: App;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();

    const fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
  });

  describe('initialization', () => {
    it('should create the app', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with 3 default todos', () => {
      expect(component.todos().length).toBe(3);
    });

    it('should initialize with empty newTodoText', () => {
      expect(component.newTodoText()).toBe('');
    });

    it('should default to "all" filter', () => {
      expect(component.filter()).toBe('all');
    });

    it('should initialize with no editing state', () => {
      expect(component.editingId()).toBeNull();
      expect(component.editText()).toBe('');
    });
  });

  describe('addTodo', () => {
    it('should add a new todo to the beginning of the list', () => {
      const initialCount = component.todos().length;
      component.newTodoText.set('New test todo');
      component.addTodo();

      expect(component.todos().length).toBe(initialCount + 1);
      expect(component.todos()[0].text).toBe('New test todo');
    });

    it('should clear newTodoText after adding', () => {
      component.newTodoText.set('New test todo');
      component.addTodo();

      expect(component.newTodoText()).toBe('');
    });

    it('should not add empty todos', () => {
      const initialCount = component.todos().length;
      component.newTodoText.set('');
      component.addTodo();

      expect(component.todos().length).toBe(initialCount);
    });

    it('should not add whitespace-only todos', () => {
      const initialCount = component.todos().length;
      component.newTodoText.set('   ');
      component.addTodo();

      expect(component.todos().length).toBe(initialCount);
    });

    it('should trim whitespace from new todos', () => {
      component.newTodoText.set('  Trimmed todo  ');
      component.addTodo();

      expect(component.todos()[0].text).toBe('Trimmed todo');
    });

    it('should create new todo with completed set to false', () => {
      component.newTodoText.set('New todo');
      component.addTodo();

      expect(component.todos()[0].completed).toBe(false);
    });

    it('should create new todo with numeric id', () => {
      component.newTodoText.set('New todo');
      component.addTodo();

      const newTodo = component.todos()[0];
      expect(typeof newTodo.id).toBe('number');
      expect(newTodo.id).toBeGreaterThan(0);
    });
  });

  describe('toggleTodo', () => {
    it('should toggle a todo from incomplete to complete', () => {
      const incompleteTodo = component.todos().find((t) => !t.completed);
      expect(incompleteTodo).toBeDefined();

      component.toggleTodo(incompleteTodo!.id);

      const updatedTodo = component.todos().find((t) => t.id === incompleteTodo!.id);
      expect(updatedTodo?.completed).toBe(true);
    });

    it('should toggle a todo from complete to incomplete', () => {
      const completeTodo = component.todos().find((t) => t.completed);
      expect(completeTodo).toBeDefined();

      component.toggleTodo(completeTodo!.id);

      const updatedTodo = component.todos().find((t) => t.id === completeTodo!.id);
      expect(updatedTodo?.completed).toBe(false);
    });

    it('should not affect other todos when toggling', () => {
      const todos = component.todos();
      const todoToToggle = todos[0];
      const otherTodo = todos[1];
      const otherTodoCompletedBefore = otherTodo.completed;

      component.toggleTodo(todoToToggle.id);

      const updatedOtherTodo = component.todos().find((t) => t.id === otherTodo.id);
      expect(updatedOtherTodo?.completed).toBe(otherTodoCompletedBefore);
    });
  });

  describe('deleteTodo', () => {
    it('should remove a todo from the list', () => {
      const initialCount = component.todos().length;
      const todoToDelete = component.todos()[0];

      component.deleteTodo(todoToDelete.id);

      expect(component.todos().length).toBe(initialCount - 1);
      expect(component.todos().find((t) => t.id === todoToDelete.id)).toBeUndefined();
    });

    it('should not affect other todos when deleting', () => {
      const todos = component.todos();
      const todoToDelete = todos[0];
      const remainingTodo = todos[1];

      component.deleteTodo(todoToDelete.id);

      expect(component.todos().find((t) => t.id === remainingTodo.id)).toBeDefined();
    });
  });

  describe('editing', () => {
    it('should set editingId and editText when starting to edit', () => {
      const todo = component.todos()[0];

      component.startEditing(todo);

      expect(component.editingId()).toBe(todo.id);
      expect(component.editText()).toBe(todo.text);
    });

    it('should update todo text when saving edit', () => {
      const todo = component.todos()[0];
      component.startEditing(todo);
      component.editText.set('Updated text');

      component.saveEdit(todo.id);

      const updatedTodo = component.todos().find((t) => t.id === todo.id);
      expect(updatedTodo?.text).toBe('Updated text');
    });

    it('should clear editing state after saving', () => {
      const todo = component.todos()[0];
      component.startEditing(todo);
      component.editText.set('Updated text');

      component.saveEdit(todo.id);

      expect(component.editingId()).toBeNull();
      expect(component.editText()).toBe('');
    });

    it('should delete todo if saved with empty text', () => {
      const todo = component.todos()[0];
      const initialCount = component.todos().length;
      component.startEditing(todo);
      component.editText.set('');

      component.saveEdit(todo.id);

      expect(component.todos().length).toBe(initialCount - 1);
      expect(component.todos().find((t) => t.id === todo.id)).toBeUndefined();
    });

    it('should delete todo if saved with whitespace-only text', () => {
      const todo = component.todos()[0];
      const initialCount = component.todos().length;
      component.startEditing(todo);
      component.editText.set('   ');

      component.saveEdit(todo.id);

      expect(component.todos().length).toBe(initialCount - 1);
    });

    it('should trim whitespace when saving edit', () => {
      const todo = component.todos()[0];
      component.startEditing(todo);
      component.editText.set('  Trimmed text  ');

      component.saveEdit(todo.id);

      const updatedTodo = component.todos().find((t) => t.id === todo.id);
      expect(updatedTodo?.text).toBe('Trimmed text');
    });

    it('should clear editing state when canceling', () => {
      const todo = component.todos()[0];
      component.startEditing(todo);

      component.cancelEdit();

      expect(component.editingId()).toBeNull();
      expect(component.editText()).toBe('');
    });

    it('should not modify todo when canceling edit', () => {
      const todo = component.todos()[0];
      const originalText = todo.text;
      component.startEditing(todo);
      component.editText.set('Changed text');

      component.cancelEdit();

      const unchangedTodo = component.todos().find((t) => t.id === todo.id);
      expect(unchangedTodo?.text).toBe(originalText);
    });
  });

  describe('setFilter', () => {
    it('should set filter to "all"', () => {
      component.setFilter('all');
      expect(component.filter()).toBe('all');
    });

    it('should set filter to "active"', () => {
      component.setFilter('active');
      expect(component.filter()).toBe('active');
    });

    it('should set filter to "completed"', () => {
      component.setFilter('completed');
      expect(component.filter()).toBe('completed');
    });
  });

  describe('filteredTodos', () => {
    it('should return all todos when filter is "all"', () => {
      component.setFilter('all');

      expect(component.filteredTodos().length).toBe(component.todos().length);
    });

    it('should return only active todos when filter is "active"', () => {
      component.setFilter('active');

      const activeTodos = component.filteredTodos();
      expect(activeTodos.every((t) => !t.completed)).toBe(true);
      expect(activeTodos.length).toBe(component.activeTodosCount());
    });

    it('should return only completed todos when filter is "completed"', () => {
      component.setFilter('completed');

      const completedTodos = component.filteredTodos();
      expect(completedTodos.every((t) => t.completed)).toBe(true);
      expect(completedTodos.length).toBe(component.completedTodosCount());
    });
  });

  describe('activeTodosCount', () => {
    it('should return count of incomplete todos', () => {
      const manualCount = component.todos().filter((t) => !t.completed).length;
      expect(component.activeTodosCount()).toBe(manualCount);
    });

    it('should update when todo is toggled to complete', () => {
      const initialCount = component.activeTodosCount();
      const activeTodo = component.todos().find((t) => !t.completed);

      component.toggleTodo(activeTodo!.id);

      expect(component.activeTodosCount()).toBe(initialCount - 1);
    });

    it('should update when todo is toggled to incomplete', () => {
      const initialCount = component.activeTodosCount();
      const completedTodo = component.todos().find((t) => t.completed);

      component.toggleTodo(completedTodo!.id);

      expect(component.activeTodosCount()).toBe(initialCount + 1);
    });
  });

  describe('completedTodosCount', () => {
    it('should return count of completed todos', () => {
      const manualCount = component.todos().filter((t) => t.completed).length;
      expect(component.completedTodosCount()).toBe(manualCount);
    });

    it('should update when todo is toggled to complete', () => {
      const initialCount = component.completedTodosCount();
      const activeTodo = component.todos().find((t) => !t.completed);

      component.toggleTodo(activeTodo!.id);

      expect(component.completedTodosCount()).toBe(initialCount + 1);
    });
  });

  describe('clearCompleted', () => {
    it('should remove all completed todos', () => {
      component.clearCompleted();

      expect(component.todos().every((t) => !t.completed)).toBe(true);
    });

    it('should keep all active todos', () => {
      const activeCountBefore = component.activeTodosCount();

      component.clearCompleted();

      expect(component.todos().length).toBe(activeCountBefore);
    });

    it('should set completedTodosCount to 0', () => {
      component.clearCompleted();

      expect(component.completedTodosCount()).toBe(0);
    });
  });
});
