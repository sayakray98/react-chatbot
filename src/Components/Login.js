import React, { useState } from 'react';

const Login = () =>  {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const loginData = {
        email,
        password
      };

      const response = await fetch('http://localhost:8080/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Login successful:', data);

        // Save the token and user name to localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('userName', data.user.name);

        // Redirect the user to the home page or another route
         // Replace with your desired route
      } else if (response.status === 404) {
        console.error('Login error: 404 Not Found');
        setError('The login endpoint was not found. Please check the server configuration.');
      } else {
        try {
          const errorData = await response.json();
          console.error('Login error:', errorData.error);
          setError(errorData.error || 'An unexpected error occurred. Please try again later.');
        } catch (parseError) {
          console.error('Login error:', parseError.message);
          setError('An unexpected error occurred. Please try again later.');
        }
      }
    } catch (error) {
      console.error('Login error:', error.message);

      if (error.message === 'NetworkError when attempting to fetch resource.') {
        setError('Unable to connect to the server. Please check your network connection and try again.');
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
    }
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleLoginSubmit}>
        <label>
          Email:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <br />
        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <br />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;