import Chip from '@mui/material/Chip';
import { Box, Typography } from '@mui/material';

export const tagGroups = [
    { title: "Lines of business", tags: ["Property", "Casualty", "Financial Lines", "Cyber", "Marine", "Hull & War", "Energy", "Aviation", "Terrorism & PV", "Political Risk & Credit", "Motor", "Reinsurance"] },
    { title: "Themes", tags: ["Climate", "Legislation", "M&A", "People"] },
];
export const tagWords = ["All", ...tagGroups.flatMap((g) => g.tags)];

function TagChip({ t, active, onSelect }) {
    return (
        <Chip
            label={t}
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(t)}
            color={active ? 'secondary' : 'default'}
            variant={active ? 'filled' : 'outlined'}
            size="small"
            sx={active ? { fontWeight: 600 } : { bgcolor: '#fff' }}
        />
    );
}

export default function Tags({ tag, onSelect }) {
    return (
        <Box role="tablist" aria-label="Filter by line of business" className="tag-bar">
            <div className="tag-group">
                <TagChip t="All" active={tag === "All"} onSelect={onSelect} />
            </div>
            {tagGroups.map((g) => (
                <div className="tag-group" key={g.title}>
                    <Typography component="span" className="tag-group-title">{g.title}</Typography>
                    {g.tags.map((t) => <TagChip key={t} t={t} active={tag === t} onSelect={onSelect} />)}
                </div>
            ))}
        </Box>
    );
}
