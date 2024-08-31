import { useContext, useEffect, useState } from "react";
import Avatar from "./Avatar";
import Logo from "./Logo";
import { UserContext } from "./UserContext";
import { uniqBy } from "lodash";

export default function Chat() {
  const { username, id } = useContext(UserContext);
  //   console.log(id);
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [newMessageText, setNewMessageText] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messages, setMessages] = useState([]);

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
      } else if ("text" in messageData) {
        // console.log(messageData)
        setMessages((prev) => [...prev, { ...messageData }]);
      }
      console.log({ ev, messageData });
    }
  }, []);
  function sendMessage(ev) {
    ev.preventDefault();
    ws.send(
      JSON.stringify({
        recipient: selectedUserId,
        text: newMessageText,
      })
    );
    setNewMessageText("");
    setMessages((prev) => [
      ...prev,
      { text: newMessageText, sender: id, recipient: selectedUserId,id:Date.now() },
    ]);
    // console.log("sending")
  }

  const onlinePeopleExcludingLoggedInUser = { ...onlinePeople };
  delete onlinePeopleExcludingLoggedInUser[id];

  const messagesWithoutDupes = uniqBy(messages, "id");
  return (
    <div className="flex h-screen">
      <div className="bg-white w-1/3 py-3 pl-3">
        <Logo />
        <div className="px-2 pb-2 font-thin text-sm">User:{username}</div>
        {Object.keys(onlinePeopleExcludingLoggedInUser).map((userId) => (
          <div
            onClick={() => setSelectedUserId(userId)}
            className={
              "border-b border-gray-200 cursor-pointer flex items-center gap-2 " +
              (userId === selectedUserId ? "bg-blue-100 font-bold" : "")
            }
            key={userId}
          >
            {userId === selectedUserId && (
              <div className="h-12 w-1 bg-blue-500 rounded-r-md"></div>
            )}
            <div className="py-2 pl-3 flex items-center gap-2">
              <Avatar username={onlinePeople[userId]} userId={userId} />
              <span>{onlinePeople[userId]}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-blue-100 w-2/3 flex flex-col p-2">
        <div className="flex-grow">
          {!selectedUserId && (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a person to start conversation!
            </div>
          )}
          {!!selectedUserId && (
            <div className="overflow-y-scroll">
              {messagesWithoutDupes.map((message) => (
                <div className={(message.sender===id? 'text-right':'text-left')}>
                <div className={"text-left inline-block p-2 my-2 rounded-md text-sm  "+(message.sender===id?'bg-blue-500 text-white':'bg-white text-gray-500')}>
                  sender:{message.sender}<br></br> my id = {id}<br></br>
                  {message.text}
                </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {!!selectedUserId && (
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              value={newMessageText}
              onChange={(ev) => setNewMessageText(ev.target.value)}
              className="flex-grow p-2 border rounded-md"
              placeholder="Type your message here"
            ></input>
            <button
              type="submit"
              className="bg-blue-500 text-white border rounded-md p-2"
            >
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
          </form>
        )}
      </div>
    </div>
  );
}
