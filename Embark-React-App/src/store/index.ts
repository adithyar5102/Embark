// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import workflowReducer from './workflowSlice';
import customWorkflowReducer from './customWorkflowSlice';

const store = configureStore({
  reducer: {
    workflow: workflowReducer,
    customWorkflow: customWorkflowReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
