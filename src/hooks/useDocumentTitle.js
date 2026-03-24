import { useEffect } from "react";

function useDocumentTitle(title) {
  useEffect(() => {
    document.title = `${title} | Zenvex Capital`;
  }, [title]);
}

export default useDocumentTitle;
