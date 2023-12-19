import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';

const tagWords = ["All", "Property", "Casualty", "Marine", "Energy", "Reinsurance", "Motor", "Aviation", "Legislation", "Climate", "People"]


export default function Tags(props) {
    return (
        <div className="title-tags-div">
            <Stack direction="row" spacing={1} useFlexGap >
                {tagWords.map((tag, index) =>
                    <Chip key={index}
                        id={tag}
                        size="medium"
                        label={tag}
                        onClick={(e) => { props.handleTag(e) }}
                        color={props.tag === tag ? 'secondary' : 'primary'}
                    />)}
            </Stack>
        </div>
    );
}