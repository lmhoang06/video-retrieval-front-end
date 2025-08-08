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
  ({ className, objectClassName }) => {
    return (
      <div className={className}>
        <div className="flex flex-row items-center h-7">
          <Typography variant="h6" color="blue-gray" className="capitalize">
            {objectClassName}
          </Typography>
        </div>
      </div>
    );
  }
);

ObjectChosenInfo.displayName = "ObjectChosenInfo";

function ObjectsQuery({ className, onUpdate }) {
  const [chosenObjects, setChosenObjects] = useState([]);
  const [objectsTypeList, setObjectsTypeList] = useState([]);

  useEffect(() => {
    (async function getObjectsClassName() {
      setObjectsTypeList((await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/objects/class_list`)).data?.classes);
    })();
  }, []);

  useEffect(() => {
    onUpdate(chosenObjects);
  }, [chosenObjects, onUpdate]);

  return (
    <Card className={className}>
      {/* Chosen objects */}
      <div className="flex flex-col gap-1 overflow-y-auto max-h-60 border-light-blue-500">
        {chosenObjects.map((className, index) => (
          <Chip
            variant="outlined"
            color="light-blue"
            size="md"
            key={index}
            className="py-0"
            value={
              <ObjectChosenInfo
                objectClassName={className}
              />
            }
            onClose={() =>
              setChosenObjects((prev) =>
                prev.filter(cn => cn != className)
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
            {objectsTypeList.map((className, index) => (
              <MenuItem
                key={index}
                id={className}
                onClick={() =>
                  setChosenObjects((prev) =>
                    prev.includes(className) ? prev : [...prev, className]
                  )
                }
                className="flex flex-row"
              >
                <Typography variant="small" color="blue-gray">
                  {className}
                </Typography>
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      </div>
    </Card>
  );
}

export default memo(ObjectsQuery);
