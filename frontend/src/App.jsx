import { useEffect, useState } from "react";
import { getTestMessage } from "./api";

function App() {
    const [message, setMessage] = useState("");

    useEffect(() => {
        getTestMessage().then(data => {
            if (data) {
                setMessage(data.message);
            }
        });
    }, []);

    return (
        <div>
            <h1>React-Django Connection</h1>
            <p>{message}</p>
        </div>
    );
}

export default App;
