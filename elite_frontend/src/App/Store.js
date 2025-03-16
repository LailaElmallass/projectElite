import { configureStore } from "@reduxjs/toolkit";
import AuthReducer from "../features/AuthSlice";
import UserReducer from "../features/UserSlice";

const store = configureStore({
  reducer: {
    auth: AuthReducer,
    users: UserReducer,       
  },
  devTools: true, 
});

export default store;
