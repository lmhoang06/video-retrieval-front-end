"use client";

import {
  Typography,
  Input,
  Button,
  Card,
  Chip,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
} from "@material-tailwind/react";
import React, { useState, useEffect, memo } from "react";
import axios from "axios";

const ObjectChosenInfo = memo(
  ({ className, objectClassName, numberOfObject, onChange }) => {
    return (
      <div className={className}>
        <div className="flex flex-row items-center h-7">
          <Typography variant="h6" color="blue-gray" className="capitalize">
            {objectClassName}
          </Typography>
          <div className="ml-auto py-0.5 h-full">
            <Input
              type="number"
              placeholder=""
              min={0}
              max={999}
              defaultValue={numberOfObject}
              onChange={(event) => onChange(event.target.value)}
              className="!border !border-gray-400 !p-0.5 text-center bg-white text-gray-900 ring-4 ring-transparent placeholder:text-gray-500 placeholder:opacity-100 focus:!border-gray-900 focus:!border-t-gray-900 focus:ring-gray-900/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              labelProps={{
                className: "hidden",
              }}
              containerProps={{
                className: "!min-w-0 !min-h-0 h-full !aspect-square",
              }}
            />
          </div>
        </div>
      </div>
    );
  }
);

ObjectChosenInfo.displayName = "ObjectChosenInfo;";

function ObjectsQuery({ className, onUpdate }) {
  const [chosenObjects, setChosenObjects] = useState([]);
  const [objectsTypeList, setObjectsTypeList] = useState([]);

  useEffect(() => {
    (async function getObjectsClassName() {
      setObjectsTypeList((await axios.get("/api/objects/classList")).data);
    })();
  }, []);

  useEffect(() => {
    onUpdate(chosenObjects);
  }, [chosenObjects, onUpdate]);

  return (
    <Card className={className}>
      {/* Chosen objects */}
      <div className="flex flex-col gap-1 overflow-y-auto max-h-60 border-light-blue-500">
        {chosenObjects.map(({ className, number }, index) => (
          <Chip
            variant="outlined"
            color="light-blue"
            size="md"
            key={index}
            className="py-0"
            value={
              <ObjectChosenInfo
                objectClassName={className}
                numberOfObject={number}
                onChange={(newValue) => {
                  setChosenObjects((prev) => [
                    ...prev.filter(({ className: cn }) => cn != className),
                    {
                      className: className,
                      number: newValue,
                    },
                  ]);
                }}
              />
            }
            onClose={() =>
              setChosenObjects((prev) =>
                prev.filter(({ className: cn }) => cn != className)
              )
            }
          />
        ))}
      </div>

      {/* Choosing objects */}
      <div className="flex flex-col gap-1 mt-2">
        <Menu placement="right-start" offset={8}>
          <MenuHandler>
            <Button variant="outlined" color="blue" className="p-2 w-full">
              Choose objects
            </Button>
          </MenuHandler>
          <MenuList className="max-h-72 w-60">
            {objectsTypeList.map(({ className, count }, index) => (
              <MenuItem
                key={index}
                id={className}
                onClick={() =>
                  setChosenObjects((prev) =>
                    prev.some((obj) => obj.className === className)
                      ? prev
                      : [...prev, { className: className, number: 0 }]
                  )
                }
                className="flex flex-row"
              >
                <Typography variant="small" color="blue-gray">
                  {className}
                </Typography>
                <Chip
                  value={count}
                  color="blue"
                  size="sm"
                  variant="gradient"
                  className="ml-auto py-0.5"
                />
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      </div>
    </Card>
  );
}

export default memo(ObjectsQuery);
