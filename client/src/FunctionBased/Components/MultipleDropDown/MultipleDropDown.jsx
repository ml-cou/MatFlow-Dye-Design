import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import { Autocomplete, Checkbox, TextField } from "@mui/material";
import { useEffect, useState } from "react";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const MultipleDropDown = ({
  columnNames,
  setSelectedColumns,
  curInd = 0,
  disabled = false,
  defaultValue,
}) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAllLabel, setSelectAllLabel] = useState("Select All");

  const handleSelectionChange = (newValue) => {
    if (newValue.includes(selectAllLabel)) {
      if (selectAllLabel === "Select All") {
        // Select all items
        const allOptions = [...columnNames];
        setSelectedItems(allOptions);
        setSelectedColumns(allOptions, curInd);
        setSelectAllLabel("Unselect All");
      } else {
        // Unselect all items
        setSelectedItems([]);
        setSelectedColumns([], curInd);
        setSelectAllLabel("Select All");
      }
    } else {
      // Handle normal selections
      setSelectedItems(newValue);
      setSelectedColumns(newValue, curInd);

      // Update "Select All" label based on current selection state
      if (newValue.length === columnNames.length) {
        setSelectAllLabel("Unselect All");
      } else {
        setSelectAllLabel("Select All");
      }
    }
  };

  useEffect(() => {
    if (defaultValue) {
      setSelectedItems(defaultValue);
      if (defaultValue.length === columnNames.length) {
        setSelectAllLabel("Unselect All");
      }
    }
  }, [defaultValue, columnNames]);

  return (
    <div className="mt-1">
      <Autocomplete
        multiple
        limitTags={2}
        id="checkboxes-tags-demo"
        options={[selectAllLabel, ...columnNames]} // Dynamic label for "Select All"
        disabled={disabled}
        disableCloseOnSelect
        value={selectedItems}
        onChange={(e, newValue) => handleSelectionChange(newValue)}
        getOptionLabel={(option) => option}
        renderOption={(props, option, { selected }) => (
          <li {...props}>
            <Checkbox
              icon={icon}
              checkedIcon={checkedIcon}
              style={{ marginRight: 4 }}
              checked={
                selected ||
                (option === selectAllLabel &&
                  selectedItems.length === columnNames.length)
              }
            />
            {option}
          </li>
        )}
        size="small"
        renderInput={(params) => <TextField {...params} />}
      />
    </div>
  );
};

export default MultipleDropDown;
