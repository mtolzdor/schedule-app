import { signIn, signOut, useSession } from "next-auth/react";
import { BiLogOut, BiMenu } from "react-icons/bi";
import Link from "next/link";
import { VscAccount } from "react-icons/vsc";
import { GrGroup } from "react-icons/gr";
import { api } from "~/utils/api";

export const Header: React.FC = () => {
  //const { data: sessionData } = useSession();

  return (
    <div className="navbar border-b-2 border-slate-800 bg-slate-700">
      <div className="flex-1">
        <div className="btn-ghost btn text-xl normal-case text-white">
          <Link href={"/"}>Scheduler</Link>
        </div>
      </div>
      <div className="flex-none">
        <Menu />
      </div>
    </div>
  );
};

const Menu = () => {
  return (
    <div className="dropdown-end dropdown">
      <label tabIndex={0} className="btn-ghost btn">
        <BiMenu size={28} color="white" />
      </label>
      <ul className="dropdown-content menu rounded-box w-52 bg-base-100 p-2 shadow">
        <li>
          <Link href="/profile">
            <VscAccount />
            Profile
          </Link>
        </li>
        <li>
          <GroupList />
        </li>
        <li>
          <button onClick={() => signOut()}>
            <BiLogOut />
            Log Out
          </button>
        </li>
      </ul>
    </div>
  );
};

const GroupList = () => {
  const { data, isSuccess, isFetching } = api.users.getUserGroups.useQuery();

  if (isFetching) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dropdown dropdown-left dropdown-hover overflow-hidden hover:overflow-visible">
      <label tabIndex={0} className="flex flex-row">
        <GrGroup className="mr-2 mt-1" />
        Groups
      </label>
      {isSuccess && (
        <ul
          tabIndex={0}
          className="dropdown-content menu rounded-box w-52 bg-base-100 p-2 shadow"
        >
          {data.map((group) => (
            <li key={group.groupId}>
              <Link href={`/group/${group.groupId}`}>{group.group.name}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
