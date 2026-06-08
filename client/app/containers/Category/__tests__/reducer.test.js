import categoryReducer from '../reducer';
import {
  FETCH_CATEGORIES,
  FETCH_STORE_CATEGORIES,
  FETCH_CATEGORY,
  ADD_CATEGORY,
  REMOVE_CATEGORY,
  CATEGORY_CHANGE,
  CATEGORY_EDIT_CHANGE,
  SET_CATEGORY_FORM_ERRORS,
  SET_CATEGORY_FORM_EDIT_ERRORS,
  SET_CATEGORIES_LOADING,
  RESET_CATEGORY,
  CATEGORY_SELECT
} from '../constants';

const initialState = {
  categories: [],
  storeCategories: [],
  selectedCategory: null,
  category: { _id: '' },
  categoryFormData: {
    name: '',
    description: '',
    products: [],
    isActive: true
  },
  formErrors: {},
  editFormErrors: {},
  isLoading: false
};

describe('categoryReducer', () => {
  it('returns the initial state for an unknown action', () => {
    expect(categoryReducer(undefined, { type: '__UNKNOWN__' })).toEqual(initialState);
  });

  it('FETCH_CATEGORIES replaces the categories list', () => {
    const cats = [{ _id: '1', name: 'Shoes' }];
    const state = categoryReducer(undefined, { type: FETCH_CATEGORIES, payload: cats });
    expect(state.categories).toEqual(cats);
  });

  it('FETCH_STORE_CATEGORIES replaces storeCategories', () => {
    const cats = [{ _id: '2', name: 'Boots' }];
    const state = categoryReducer(undefined, { type: FETCH_STORE_CATEGORIES, payload: cats });
    expect(state.storeCategories).toEqual(cats);
  });

  it('FETCH_CATEGORY replaces the single category', () => {
    const cat = { _id: '3', name: 'Hats' };
    const state = categoryReducer(undefined, { type: FETCH_CATEGORY, payload: cat });
    expect(state.category).toEqual(cat);
  });

  it('ADD_CATEGORY appends to the categories list without mutating others', () => {
    const existing = [{ _id: 'a', name: 'Bags' }];
    const prev = categoryReducer(undefined, { type: FETCH_CATEGORIES, payload: existing });
    const newCat = { _id: 'b', name: 'Belts' };
    const next = categoryReducer(prev, { type: ADD_CATEGORY, payload: newCat });
    expect(next.categories).toHaveLength(2);
    expect(next.categories[1]).toEqual(newCat);
    expect(prev.categories).toHaveLength(1);
  });

  it('REMOVE_CATEGORY removes the category with the matching _id', () => {
    const cats = [
      { _id: 'x', name: 'Alpha' },
      { _id: 'y', name: 'Beta' },
      { _id: 'z', name: 'Gamma' }
    ];
    const prev = categoryReducer(undefined, { type: FETCH_CATEGORIES, payload: cats });
    const next = categoryReducer(prev, { type: REMOVE_CATEGORY, payload: 'y' });
    expect(next.categories).toHaveLength(2);
    expect(next.categories.find(c => c._id === 'y')).toBeUndefined();
    expect(next.categories.map(c => c._id)).toEqual(['x', 'z']);
  });

  it('CATEGORY_CHANGE merges into categoryFormData', () => {
    const state = categoryReducer(undefined, {
      type: CATEGORY_CHANGE,
      payload: { name: 'Sneakers' }
    });
    expect(state.categoryFormData.name).toBe('Sneakers');
    expect(state.categoryFormData.isActive).toBe(true);
  });

  it('CATEGORY_EDIT_CHANGE merges into category', () => {
    const state = categoryReducer(undefined, {
      type: CATEGORY_EDIT_CHANGE,
      payload: { name: 'Sandals' }
    });
    expect(state.category.name).toBe('Sandals');
    expect(state.category._id).toBe('');
  });

  it('SET_CATEGORY_FORM_ERRORS replaces formErrors', () => {
    const errors = { name: 'Required' };
    const state = categoryReducer(undefined, { type: SET_CATEGORY_FORM_ERRORS, payload: errors });
    expect(state.formErrors).toEqual(errors);
  });

  it('SET_CATEGORY_FORM_EDIT_ERRORS replaces editFormErrors', () => {
    const errors = { name: 'Too short' };
    const state = categoryReducer(undefined, { type: SET_CATEGORY_FORM_EDIT_ERRORS, payload: errors });
    expect(state.editFormErrors).toEqual(errors);
  });

  it('SET_CATEGORIES_LOADING sets isLoading flag', () => {
    const loading = categoryReducer(undefined, { type: SET_CATEGORIES_LOADING, payload: true });
    expect(loading.isLoading).toBe(true);
    const done = categoryReducer(loading, { type: SET_CATEGORIES_LOADING, payload: false });
    expect(done.isLoading).toBe(false);
  });

  it('RESET_CATEGORY clears form data, category identity, and errors', () => {
    const dirty = categoryReducer(undefined, {
      type: CATEGORY_CHANGE,
      payload: { name: 'Dirty', description: 'tmp', isActive: false }
    });
    const reset = categoryReducer(dirty, { type: RESET_CATEGORY });
    expect(reset.categoryFormData).toEqual({
      name: '',
      description: '',
      products: [],
      isActive: true
    });
    expect(reset.category._id).toBe('');
    expect(reset.formErrors).toEqual({});
    expect(reset.editFormErrors).toEqual({});
  });

  // Bug #6 fixed — CATEGORY_SELECT was exported from constants.js but never
  // imported in actions.js (ReferenceError on dispatch) and had no reducer
  // handler (silent no-op). Fix: imported in actions.js; reducer now sets
  // selectedCategory. This test verifies the fixed behaviour.
  it('CATEGORY_SELECT sets selectedCategory [Bug #6 fixed]', () => {
    const cats = [{ _id: '1', name: 'Shoes' }];
    const prev = categoryReducer(undefined, { type: FETCH_CATEGORIES, payload: cats });
    const next = categoryReducer(prev, { type: CATEGORY_SELECT, payload: '1' });
    expect(next.selectedCategory).toBe('1');
    expect(next.categories).toEqual(prev.categories);
  });
});
