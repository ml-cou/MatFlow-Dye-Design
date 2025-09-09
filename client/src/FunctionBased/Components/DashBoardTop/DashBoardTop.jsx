import { Button, Popover, User } from "@nextui-org/react";
import React from "react";
import { FiLogOut } from "react-icons/fi";
import { GiHamburgerMenu } from "react-icons/gi";
import { RxQuestionMark } from "react-icons/rx";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { setShowLeftSideBar } from "../../../Slices/SideBarSlice";

function DashBoardTop() {
  const showLeftSideBar = useSelector((state) => state.sideBar.showLeftSideBar);
  const dispatch = useDispatch();

  return (
    <div className="flex px-4 py-2 shadow items-center justify-between bg-[#064f32] ">
      <div className="flex items-center gap-2 cursor-pointer">
        <GiHamburgerMenu
          color="white"
          className={`${showLeftSideBar ? "hidden" : "flex"}`}
          onClick={() => dispatch(setShowLeftSideBar(true))}
        />
        <Link
          className="font-titillium font-bold tracking-widest cursor-pointer text-white"
          to={"/"}
        >
          MATFLOW
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <RxQuestionMark color="white" size={"22"} className="cursor-pointer" />

        <div>
          <Popover>
            <Popover.Trigger>
              <User as="button" text="A" />
            </Popover.Trigger>
            <Popover.Content css={{ px: "$4", py: "$2" }}>
              <UserCard />
            </Popover.Content>
          </Popover>
        </div>
      </div>
    </div>
  );
}

function UserCard() {
  return (
    <div>
      <Button light className="mb-2">
        Profile
      </Button>
      <Button icon={<FiLogOut />} flat color={"error"}>
        Logout
      </Button>
    </div>
  );
}

export default DashBoardTop;
