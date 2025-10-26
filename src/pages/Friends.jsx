import React, { useState } from "react";
import Navbar from '../components/Navbar'

/**
 * Friends page with modal add form.
 * Tailwind classes used — expects Tailwind configured in the project.
 */

const initialFriends = [
  {
    name: "Alice",
    icon: "https://i.pravatar.cc/150?img=1",
    lastSong: "Bohemian Rhapsody",
    email: "alice@example.com",
    phone: "+1234567890",
  },
  {
    name: "Bob",
    icon: "https://i.pravatar.cc/150?img=2",
    lastSong: "Shape of You",
    email: "bob@example.com",
    phone: "+1987654321",
  },
];

export default function Friends() {
  // Load friends from localStorage on mount
  const [friends, setFriends] = useState(() => {
    const saved = localStorage.getItem('friends');
    if (saved) {
      return JSON.parse(saved);
    }
    // If no saved friends, use initial and save them
    initialFriends.forEach((friend, index) => {
      if (!friend.id) friend.id = index + 1;
    });
    localStorage.setItem('friends', JSON.stringify(initialFriends));
    return initialFriends;
  });
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    icon: "",
    lastSong: "",
    email: "",
    phone: "",
  });
  const [error, setError] = useState("");

  const openForm = () => {
    setForm({ name: "", icon: "", lastSong: "", email: "", phone: "" });
    setError("");
    setIsOpen(true);
  };
  const closeForm = () => setIsOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleAdd = (e) => {
    e.preventDefault();
    // basic validation
    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }
    const newFriend = {
      id: Date.now(), // Add unique ID
      name: form.name.trim(),
      icon: form.icon.trim() || `https://i.pravatar.cc/150?u=${Date.now()}`,
      lastSong: form.lastSong.trim() || "—",
      email: form.email.trim(),
      phone: form.phone.trim() || "",
    };
    const updatedFriends = [newFriend, ...friends];
    setFriends(updatedFriends);
    localStorage.setItem('friends', JSON.stringify(updatedFriends));
    setIsOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6 text-black">My Friends</h1>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {friends.map((friend, idx) => (
            <div
              key={idx}
              className="flex items-center p-4 bg-white rounded-xl shadow hover:shadow-lg transition"
            >
              <img
                src={friend.icon}
                alt={friend.name}
                className="w-16 h-16 rounded-full mr-4 object-cover"
              />
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-semibold text-lg text-black">{friend.name}</h2>
                </div>
                <p className="text-gray-600 text-sm">
                  Last sang: <span className="font-medium">{friend.lastSong}</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-3 text-sm">
                  <a
                    href={`mailto:${friend.email}`}
                    className="text-blue-500 hover:underline break-words"
                  >
                    {friend.email}
                  </a>
                  {friend.phone && (
                    <a
                      href={`tel:${friend.phone}`}
                      className="text-green-500 hover:underline"
                    >
                      {friend.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Floating Add Friend Button */}
        <button
          onClick={openForm}
          aria-label="Add friend"
          className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-3xl font-bold transition-transform hover:scale-110"
        >
          +
        </button>

        {/* Modal */}
        {isOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black opacity-40"
              onClick={closeForm}
            />
            <form
              onSubmit={handleAdd}
              className="relative z-50 w-full max-w-md bg-white rounded-xl p-6 shadow-lg"
            >
              <h3 className="text-xl font-semibold mb-4">Add Friend</h3>

              {error && (
                <div className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}

              <label className="block mb-2 text-sm">
                Name <span className="text-red-500">*</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded px-3 py-2"
                />
              </label>

              <label className="block mb-2 text-sm">
                Email <span className="text-red-500">*</span>
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  type="email"
                  className="mt-1 w-full border rounded px-3 py-2"
                />
              </label>

              <label className="block mb-2 text-sm">
                Phone
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded px-3 py-2"
                />
              </label>

              <label className="block mb-2 text-sm">
                Last Song
                <input
                  name="lastSong"
                  value={form.lastSong}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded px-3 py-2"
                />
              </label>

              <label className="block mb-4 text-sm">
                Icon URL (optional)
                <input
                  name="icon"
                  value={form.icon}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="mt-1 w-full border rounded px-3 py-2"
                />
              </label>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
