export default function Avatar({userId,username}){
    const colors = ['bg-blue-200','bg-teal-200','bg-green-200',
        'bg-purple-200','bg-cyan-200','bg-stone-200']
    const userIdBase10=parseInt(userId,16);
    const colorIndex = userIdBase10 % colors.length;
    const color = colors[colorIndex];
    console.log(color)
    return(
        <div className={"h-8 w-8 rounded-full flex items-center "+color}>
            <div className="m-auto">
                {username[0]}
            </div>
        </div>
    )
}