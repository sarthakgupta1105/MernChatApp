import { useContext, useState } from "react";
import axios from "axios";
import { UserContext } from "./UserContext";

export default function RegisterAndLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { setUsername: setLoggedInUser, setId } = useContext(UserContext);
  const [isLoggedInOrRegister, setIsLoggedInOrRegister] = useState('register');
  async function handleSubmit(ev) {
    ev.preventDefault();
    let url = isLoggedInOrRegister==='register'?'/register':'/login'
    let { data } = await axios.post(url, { username, password });
    setLoggedInUser(username);
    setId(data.id);
  }
  return (
    <div className="h-screen bg-blue-50 flex item-center justify-center">
      <div className="h-3/6 w-3/6 bg-blue-100 rounded-2xl shadow-lg m-auto flex flex-col item-center justify-center">
        <p className="text-white text-2xl font-bold text-center py-6">
          MERN Chat
        </p>
        {/* <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="gray"
            className="h-3/6 w-3/6 mb-48 mx-3"
          >
            <path
              fillRule="evenodd"
              d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
              clipRule="evenodd"
            />
          </svg> */}

        <div className="h-3/6 w-3/6 m-auto ">
          
          <form onSubmit={handleSubmit}>
            <input
              value={username}
              onChange={(ev) => setUsername(ev.target.value)}
              placeholder="Username"
              className="w-full rounded-lg px-3"
            ></input>
            <input
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              type="password"
              placeholder="Password"
              className="w-full my-6 rounded-lg px-3"
            ></input>
            <button className="bg-blue-300 px-3 py-2  text-white rounded-lg w-full">
              {isLoggedInOrRegister === 'register' ? "Register" : "Login"}
            </button>
          </form>
          <div className="text-center text-black mt-2">
            {isLoggedInOrRegister === 'register' && (
              <div>
                Already a Member?
                <button onClick={()=>setIsLoggedInOrRegister('login')}>
                  Login In
                </button>
              </div>
            )}
            {isLoggedInOrRegister === 'login' && (
              <div>
                Dont Have an Account?
                <button onClick={()=>setIsLoggedInOrRegister('register')}>
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
