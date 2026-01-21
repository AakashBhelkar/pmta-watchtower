import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

export default function DateRangePicker({
    start,
    end,
    onChangeStart,
    onChangeEnd,
    disabled = false
}) {
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                <DateTimePicker
                    label="From"
                    value={start ? dayjs(start) : null}
                    onChange={(newValue) => onChangeStart(newValue ? newValue.toDate() : null)}
                    disabled={disabled}
                    slotProps={{
                        textField: {
                            size: 'small',
                            fullWidth: true,
                            sx: { minWidth: 200 }
                        },
                    }}
                />

                <DateTimePicker
                    label="To"
                    value={end ? dayjs(end) : null}
                    onChange={(newValue) => onChangeEnd(newValue ? newValue.toDate() : null)}
                    disabled={disabled}
                    slotProps={{
                        textField: {
                            size: 'small',
                            fullWidth: true,
                            sx: { minWidth: 200 }
                        },
                    }}
                />
            </Stack>
        </LocalizationProvider>
    );
}

DateRangePicker.propTypes = {
    start: PropTypes.instanceOf(Date),
    end: PropTypes.instanceOf(Date),
    onChangeStart: PropTypes.func.isRequired,
    onChangeEnd: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
};
