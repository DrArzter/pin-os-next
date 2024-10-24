'use client';
import React, { useEffect, use } from "react";

import IconList from "./IconList";

import { FaBell } from "react-icons/fa";
import { CiSquarePlus } from "react-icons/ci";
import { AiOutlineMessage } from "react-icons/ai";
import { RiLoginBoxFill } from "react-icons/ri";
import { SlMagnifier } from "react-icons/sl";
import { BsFillFileEarmarkPostFill } from "react-icons/bs";

import { useNotificationContext } from "@/app/contexts/NotificationContext";
import { useWindowContext } from "@/app/contexts/WindowContext";
import { useUserContext } from "@/app/contexts/userContext";


interface FooterProps {
  windows: Window[];
  setWindows: React.Dispatch<React.SetStateAction<Window[]>>;
}

export default function Footer() {
  const { user } = useUserContext();

  const { openWindowByPath } = useWindowContext();

  const backgroundColor = user && user.settings?.bgColor ? `rgba(${user.settings.bgColor})` : 'rgba(255,255,255,0.3)';

  const iconList = [
    {
      name: "Post", icon: <BsFillFileEarmarkPostFill className="w-8 h-8 text-white hover:transform hover:scale-110 hover:cursor-pointer transition duration-300"
        onClick={() => { openWindowByPath("/posts"); }} />
    },

    {
      name: "Bell", icon: <FaBell className="w-8 h-8 text-white hover:transform hover:scale-110 hover:cursor-pointer transition duration-300"
        onClick={() => { handleButtonClicksex(); }} />
    },

    user ? {
      name: "Add", icon: (<CiSquarePlus className="w-8 h-8 text-white hover:transform hover:scale-110 hover:cursor-pointer transition duration-300"
        onClick={() => { openWindowByPath("/post/create"); }} />
      )
    } : null,

    { name: "Message", icon: <AiOutlineMessage className="w-8 h-8 text-white hover:transform hover:scale-110 hover:cursor-pointer transition duration-300" /> },

    !user && {
      name: "Authentication",
      icon: (<RiLoginBoxFill className="w-8 h-8 text-white hover:scale-110 hover:cursor-pointer transition duration-300"
        onClick={() => openWindowByPath("/authentication")} />
      ),
    },

    { name: "Search", icon: <SlMagnifier className="w-8 h-8 text-white hover:transform hover:scale-110 hover:cursor-pointer transition duration-300" /> },
  ].filter(Boolean);

  const { addNotification } = useNotificationContext();

  const handleButtonClicksex = () => {
    addNotification({
      message: `Сначала авторизуйтесь`,
      status: "info",
      time: 5000,
      clickable: true,
      link_to: "/authentication",
    });
  };

  return (
    <footer
      style={{
        backgroundColor: backgroundColor
      }}
      className={`backdrop-blur-xl rounded-lg bg-opacity-30 border-2 md:w-1/2 mx-auto text-center py-2 absolute bottom-2 left-0 right-0 shadow-lg`}>
      <IconList iconList={iconList} />
    </footer>
  );
}