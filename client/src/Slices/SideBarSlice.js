import { createSlice } from "@reduxjs/toolkit";

export const SideBarSlice = createSlice({
  name: "sideBar",
  initialState: {
    showLeftSideBar: true,
    showRightSideBar: true,
    activeFunction: "Display",
    data: {},
    nodeType: '',
    active_id: ''
  },
  reducers: {
    setShowLeftSideBar: (state, { payload }) => {
      state.showLeftSideBar = payload;
    },
    setShowRightSideBar: (state, { payload }) => {
      state.showRightSideBar = payload;
    },
    setActiveFunction: (state, { payload }) => {
      state.activeFunction = payload;
    },
    setRightSidebarData: (state, {payload}) => {
      state.data = payload
    },
    setNodeType: (state, {payload}) => {
      state.nodeType = payload;
    },
    setActiveID: (state, {payload}) => {
      state.active_id = payload
    }
  },
});

// Action creators are generated for each case reducer function
export const { setShowLeftSideBar, setActiveFunction, setShowRightSideBar, setRightSidebarData, setNodeType, setActiveID } =
  SideBarSlice.actions;

export default SideBarSlice.reducer;
