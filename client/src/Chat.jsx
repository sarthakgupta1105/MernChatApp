import { useEffect, useState } from "react";
import Avatar from "./Avatar";

export default function Chat() {
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000");
    setWs(ws);
    ws.addEventListener("message", handlemessage);
    function showOnlinePeople(peopleArray) {
      const people = {};
      peopleArray.forEach(({ username, userId }) => {
        people[userId] = username;
      });
      setOnlinePeople(people);
    }
    function handlemessage(ev) {
      const messageData = JSON.parse(ev.data);
      if ("online" in messageData) {
        showOnlinePeople(messageData.online);
      }
    }
  }, []);
  return (
    <div className="flex h-screen">
      <div className="bg-white w-1/3 p-3">
        <div className="font-bold text-blue-700 text-2xl mb-4 flex gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-10"
          >
            <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 0 0-1.032-.211 50.89 50.89 0 0 0-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 0 0 2.433 3.984L7.28 21.53A.75.75 0 0 1 6 21v-4.03a48.527 48.527 0 0 1-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979Z" />
            <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 0 0 1.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0 0 15.75 7.5Z" />
          </svg>
          MERNchat
        </div>
        {Object.keys(onlinePeople).map((userId) => (
          <div className="border-b border-gray-400 p-4 cursor-pointer flex items-center gap-2" key={userId}>
          <Avatar username={onlinePeople[userId]} userId={userId}/>
          <span>{onlinePeople[userId]}</span>
          </div>
        ))}
      </div>
      <div className="bg-blue-200 w-2/3 flex flex-col p-2">
        <div className="flex-grow">Messages from selected contact</div>
        <div className="flex gap-2">
          <input
            className="flex-grow p-2 border rounded-md"
            placeholder="Type your message here"
          ></input>
          <button className="bg-blue-500 text-white border rounded-md p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
