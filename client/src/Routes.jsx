import { useContext } from "react";
import RegisterAndLogin from "./RegisterAndLogin";
import { UserContext } from "./UserContext";
import Chat from "./Chat";

export default function Routes(){
    const {username,id}=useContext(UserContext)

    if(username){
        return(
            <Chat/>
        )
    }
    return(
        <RegisterAndLogin/>
    )
}