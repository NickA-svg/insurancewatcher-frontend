import Chip from '@mui/material/Chip';

export const tagWords = ["All", "Property", "Casualty", "Reinsurance", "Marine", "Energy", "Aviation", "Motor", "Climate", "Legislation", "M&A", "People"]

export default function Tags({ tag, onSelect }) {
    return (
        <div className="tag-row" role="tablist" aria-label="Filter by line of business">
            {tagWords.map((t) => (
                <Chip
                    key={t}
                    label={t}
                    role="tab"
                    aria-selected={tag === t}
                    onClick={() => onSelect(t)}
                    color={tag === t ? 'secondary' : 'default'}
                    variant={tag === t ? 'filled' : 'outlined'}
                    sx={tag === t ? {} : { bgcolor: '#fff' }}
                />
            ))}
        </div>
    );
}
