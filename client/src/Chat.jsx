import { useContext, useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import Logo from "./Logo";
import { UserContext } from "./UserContext";
import { uniqBy } from "lodash";
import axios from "axios";

export default function Chat() {
  const { username, id, setId, setUsername } = useContext(UserContext);
  //   console.log(id);
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [offlinePeople, setOfflinePeople] = useState({});
  const [newMessageText, setNewMessageText] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  // const [update,setUpdate]=useState(0);
  const divUnderMessages = useRef(null);

  useEffect(() => {
    divUnderMessages.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedUserId) {
      axios.get("/messages/" + selectedUserId).then((res) => {
        setMessages(res.data);
      });
    }
  }, [selectedUserId]);

  useEffect(() => {
    axios.get("/people").then((res) => {
      const offlinePeopleArr = res.data
        .filter((p) => p._id !== id)
        .filter((p) => !Object.keys(onlinePeople).includes(p._id));
      // console.log(offlinePeopleArr)
      const offlinePeople = {};
      offlinePeopleArr.forEach((p) => {
        offlinePeople[p._id] = p;
      });
      setOfflinePeople(offlinePeople);
    });
  }, [onlinePeople]);

  useEffect(() => {
    connectToWs();
  }, []);

  function connectToWs() {
    const ws = new WebSocket("ws://localhost:8000");
    setWs(ws);
    ws.addEventListener("message", handlemessage);
    ws.addEventListener("close", () => {
      setTimeout(() => {
        console.log("Disconnected.Trying to reconnect!");
        connectToWs();
      }, 1000);
    });
  }

  function showOnlinePeople(peopleArray) {
    const people = {};
    peopleArray.forEach(({ username, userId }) => {
      people[userId] = username;
    });
    setOnlinePeople(people);
    // console.log(onlinePeople);
  }

  function handlemessage(ev) {
    const messageData = JSON.parse(ev.data);
    if ("online" in messageData) {
      showOnlinePeople(messageData.online);
    } else if ("text" in messageData) {
      // console.log(messageData);
      // console.log("data received");
      // console.log(selectedUserId);
      // console.log(messageData.sender,selectedUserId)
      //   if (messageData.sender == selectedUserId) {
      //     setMessages((prev) => [...prev, { ...messageData }])
      //   }
      setMessages((prev) => [...prev, { ...messageData }]);

    }
    console.log({ ev, messageData });
  }

  function sendMessage(ev, file = null) {
    if (ev) {
      ev.preventDefault();
      ws.send(
        JSON.stringify({
          recipient: selectedUserId,
          text: newMessageText,
          file: file,
        })
      );
      setNewMessageText("");
      setMessages((prev) => [
        ...prev,
        {
          text: newMessageText,
          sender: id,
          recipient: selectedUserId,
          _id: Date.now(),
        },
      ]);
    }

    console.log("sending");
    if (file) {
      axios.get("/messages/" + selectedUserId).then((res) => {
        setMessages(res.data);
      });
    }
  }

  function sendFile(ev) {
    const reader = new FileReader();
    reader.readAsDataURL(ev.target.files[0]);
    reader.onload = () => {
      sendMessage(null, {
        name: ev.target.files[0].name,
        data: reader.result,
      });
    };
  }

  function logout() {
    axios.post("/logout").then(() => {
      setWs(null);
      setId(null);
      setUsername(null);
    });
  }

  const onlinePeopleExcludingLoggedInUser = { ...onlinePeople };
  delete onlinePeopleExcludingLoggedInUser[id];
  // console.log(onlinePeopleExcludingLoggedInUser);

  const messagesWithoutDupes = uniqBy(messages, "_id");
  // console.log(messagesWithoutDupes);
  return (
    <div className="flex h-screen">
      <div className="bg-white w-1/3 py-3 pl-3 flex flex-col">
        <div className="flex-grow">
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
                <Avatar
                  online={true}
                  username={onlinePeople[userId]}
                  userId={userId}
                />
                <span>{onlinePeople[userId]}</span>
              </div>
            </div>
          ))}
          {Object.keys(offlinePeople).map((userId) => (
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
                <Avatar
                  online={false}
                  username={offlinePeople[userId].username}
                  userId={userId}
                />
                <span>{offlinePeople[userId].username}</span>
              </div>
            </div>
          ))}
        </div>
        <div
          onClick={logout}
          className="text-center text-sm text-gray-400 bg-blue-100 py-1 px-2 mx-2 rounded-lg border"
        >
          Logout
        </div>
      </div>
      <div className="bg-blue-100 w-2/3 flex flex-col p-2">
        <div className="flex-grow">
          {!selectedUserId && (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a person to start conversation!
            </div>
          )}
          {!!selectedUserId && (
            <div className="relative h-full">
              <div className="overflow-y-scroll absolute inset-0">
                {messagesWithoutDupes.map((message) => (
                  <div
                    key={message._id}
                    className={
                      message.sender === id ? "text-right" : "text-left"
                    }
                  >
                    <div
                      className={
                        "text-left inline-block p-2 my-2 rounded-md text-sm  " +
                        (message.sender === id
                          ? "bg-blue-500 text-white"
                          : "bg-white text-gray-500")
                      }
                    >
                      {/* sender:{message.sender}
                      <br></br> my id = {id}
                      <br></br> */}
                      {message.text}
                      {message.file && (
                        <div>
                          <a
                            target="_blank"
                            className="flex items-center gap-1 border-b"
                            href={
                              axios.defaults.baseURL +
                              "/uploads/" +
                              message.file
                            }
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
                                d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"
                              />
                            </svg>
                            {message.file}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div className="" ref={divUnderMessages}></div>
              </div>
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
            <label className="bg-gray-200 text-gray-500 border rounded-md p-2 cursor-pointer">
              <input onChange={sendFile} className="hidden" type="file"></input>
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
                  d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"
                />
              </svg>
            </label>
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
