import { useState } from "react";
import { api } from "~/utils/api";

const GroupForm = () => {
  const [group, setGroup] = useState({ name: "", email: "" });

  const newGroup = api.users.createGroup.useMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGroup({ ...group, [e.target.id]: e.target.value });
  };

  const handleSubmit = () => {
    newGroup.mutate({ name: group.name, email: group.email });
  };

  return (
    <div>
      <form className="form-control w-full max-w-xs" onSubmit={handleSubmit}>
        <label className="label">
          <span className="label-text">Name</span>
        </label>
        <input
          id="name"
          type="text"
          placeholder="Group Name?"
          className="input-bordered input w-full max-w-xs"
          value={group.name}
          onChange={handleChange}
        />
        <label className="label">
          <span className="label-text">Email</span>
        </label>
        <input
          id="email"
          type="email"
          placeholder="Email address"
          className="input-bordered input w-full max-w-xs"
          value={group.email}
          onChange={handleChange}
        ></input>
        <button type="submit" className="btn">
          Create Group
        </button>
        {newGroup.error && (
          <p>Something went wrong! {newGroup.error.message}</p>
        )}
      </form>
    </div>
  );
};

export default GroupForm;
