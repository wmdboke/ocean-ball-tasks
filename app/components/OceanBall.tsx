interface OceanBallProps {
  task: {
    id: string;
    x: number;
    y: number;
    radius: number;
    color: string;
    title: string;
    progress: number;
    milestones: { text: string; completed: boolean }[];
  };
  onMouseDown: (e: React.MouseEvent, taskId: string) => void;
  onMouseUp: (e: React.MouseEvent, taskId: string) => void;
  onClick: (e: React.MouseEvent, taskId: string) => void;
  onDoubleClick: (taskId: string) => void;
}

export default function OceanBall({ task, onMouseDown, onMouseUp, onClick, onDoubleClick }: OceanBallProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: task.x - task.radius,
        top: task.y - task.radius,
        width: task.radius * 2,
        height: task.radius * 2
      }}
      onMouseDown={(e) => onMouseDown(e, task.id)}
      onMouseUp={(e) => onMouseUp(e, task.id)}
      onClick={(e) => onClick(e, task.id)}
      onDoubleClick={() => onDoubleClick(task.id)}
      onContextMenu={(e) => e.preventDefault()}
    >
      <svg width={task.radius * 2} height={task.radius * 2} className="cursor-pointer">
        <defs>
          <clipPath id={`clip-${task.id}`}>
            <circle cx={task.radius} cy={task.radius} r={task.radius - 2} />
          </clipPath>
        </defs>
        <circle cx={task.radius} cy={task.radius} r={task.radius} fill={task.color} opacity="0.9" />
        <g clipPath={`url(#clip-${task.id})`}>
          <rect
            x="0"
            y={task.radius * 2 - (task.radius * 2 * task.progress / 100)}
            width={task.radius * 2}
            height={task.radius * 2 * task.progress / 100}
            fill="#4299e1"
            opacity="0.6"
          />
        </g>
        <circle cx={task.radius} cy={task.radius} r={task.radius} fill="none" stroke="white" strokeWidth="2" opacity="0.5" />
        <text x={task.radius} y={task.radius - 8} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="24" fontWeight="bold">
          {task.title.charAt(0)}
        </text>
        <text x={task.radius} y={task.radius + 15} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="12" opacity="0.8">
          {task.milestones.filter(m => m.completed).length}/{task.milestones.length}
        </text>
      </svg>
    </div>
  );
}
