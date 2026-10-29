import { FiSearch } from "react-icons/fi";

// Keyword search; posts to the results page like the WordPress form
// (`frm_search` keeps old links working).
export function SearchBox({
  size = "small",
  defaultValue,
}: {
  size?: "large" | "small";
  defaultValue?: string;
}) {
  const large = size === "large";
  return (
    <form
      action="/directory/search-results/"
      method="get"
      role="search"
      className={`relative ${large ? "mx-auto w-[400px] max-w-full" : "w-full"}`}
    >
      <input
        type="search"
        name="frm_search"
        defaultValue={defaultValue}
        placeholder="Search..."
        aria-label="Search the directory"
        className={`focus:border-brand w-full rounded-[30px] border border-[#191919] bg-white text-sm leading-[18.2px] text-[#555] focus:outline-none ${
          large ? "h-[52px] px-[25px]" : "h-8 px-2.5"
        }`}
      />
      <button
        type="submit"
        aria-label="Search"
        className={`text-brand absolute top-1/2 -translate-y-1/2 ${
          large ? "right-4" : "right-2"
        }`}
      >
        <FiSearch
          className={`-scale-x-100 stroke-[3] ${large ? "size-7" : "size-[18px]"}`}
        />
      </button>
    </form>
  );
}
