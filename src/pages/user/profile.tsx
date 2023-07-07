import { api } from "~/utils/api";

const Profile = () => {
  const query = api.users.getMe.useQuery();

  return (
    <div>
      <div className="flex justify-center">
        <div className="form-control">
          <label className="label">
            <span className="center-text label-text">Name:</span>
          </label>
          <input
            id="name"
            type="text"
            defaultValue={query.data?.name || "User name not set"}
            className="input-ghost input w-full max-w-xs"
          />

          <div>
            <label className="label">
              <span className="label-text">Your Email</span>
            </label>
            <label className="input-group">
              <span>Email</span>
              <input
                id="email"
                type="text"
                placeholder="info@site.com"
                defaultValue={query.data?.email}
                className="input-bordered input"
              />
            </label>
          </div>
          <button className="btn" type="submit">
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
