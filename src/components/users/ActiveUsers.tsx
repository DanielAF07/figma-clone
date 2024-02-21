import { generateRandomName } from "@/lib/utils";
import { useOthers, useSelf } from "../../../liveblocks.config";
import { Avatar } from "./Avatar";
import styles from "./index.module.css";
import { useMemo } from "react";

export function ActiveUsers() {
  const users = useOthers();
  const currentUser = useSelf();
  const hasMoreUsers = users.length > 3;

  const memoizedUsers = useMemo(() => (
    <div className="flex items-center justify-center gap-1 py-2">
    <div className="flex pl-3">
      {currentUser && (
        <div className="relative ml-8 first:ml-0">
          <Avatar name="You" otherStyles="border-[3px] border-primary-green" />
        </div>
      )}
      {users.slice(0, 3).map(({ connectionId }) => {
        return (
          <Avatar key={connectionId} name={generateRandomName()} />
        );
      })}

      {hasMoreUsers && <div className={styles.more}>+{users.length - 3}</div>}
    </div>
  </div>
  ), [users.length])

  return memoizedUsers
}