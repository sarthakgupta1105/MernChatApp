export default function Avatar({ userId, username, online }) {
  const colors = [
    "bg-blue-200",
    "bg-teal-200",
    "bg-green-200",
    "bg-purple-200",
    "bg-cyan-200",
    "bg-stone-200",
  ];
  const userIdBase10 = parseInt(userId, 16);
  const colorIndex = userIdBase10 % colors.length;
  const color = colors[colorIndex];
  // console.log(color)
  return (
    <div
      className={
        "h-8 w-8 relative rounded-full flex items-center font-normal " + color
      }
    >
      <div className="m-auto">{username[0]}</div>
      {online && (
        <div className="absolute h-3 w-3 bg-green-400 rounded-full bottom-0 right-0 border border-white"></div>
      )}
      {!online && (
        <div className="absolute h-3 w-3 bg-gray-300 rounded-full bottom-0 right-0 border border-white"></div>
      )}
    </div>
  );
}
