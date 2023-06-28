import { useEffect, useState } from "react";

export const useDebouncer = (user: string) => {
  const [value, setValue] = useState("");

  useEffect(() => {
    const debounce = setTimeout(() => {
      setValue(user);
    }, 2000);
    return () => clearTimeout(debounce);
  }, [user]);

  return value;
};
