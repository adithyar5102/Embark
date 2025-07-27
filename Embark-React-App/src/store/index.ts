// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import workflowReducer from './workflowSlice';

const store = configureStore({
  reducer: {
    workflow: workflowReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
