import React from "react";

const Friendship = () => {
  return (
    <div className="friendship-page">
      <header>
        <h1>Friendship</h1>
      </header>

      <nav>
        <a href="index.html">Home</a>
        <a href="about.html">About</a>
        <a href="friendship.html">Friendship</a>
        <a href="karaoke.html">Karaoke</a>
        <a href="songs.html">My Songs</a>
      </nav>

      <div className="friendship-container">
        <h2>Your Friends</h2>
        <ul>
          <li>
            <a href="mailto:alice@example.com">Alice</a>
          </li>
          <li>
            <a href="mailto:bob@example.com">Bob</a>
          </li>
          <li>
            <a href="mailto:charlie@example.com">Charlie</a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Friendship;
