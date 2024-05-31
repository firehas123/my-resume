import React, { useEffect, useState } from 'react';

function App() {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        fetch(process.env.REACT_APP_API_URL + '/users')
            .then(response => response.json())
            .then(data => setUsers(data));
    }, []);

    return (
        <div className="App">
            <h1>Users</h1>
            <ul>
                {users.map(user => (
                    <li key={user.id}>{user.name}</li>
                ))}
            </ul>
        </div>
    );
}

export default App;
