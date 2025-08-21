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
import React, { useState, useEffect, memo, useMemo } from "react";

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
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    (async function getObjectsClassName() {
      try {
        const res = await fetch("/object_classlist.txt");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const classes = text
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && !s.startsWith("#"));
        const uniqueSorted = [...new Set(classes)].sort((a, b) =>
          a.localeCompare(b, undefined, { sensitivity: "base" })
        );
        setObjectsTypeList(uniqueSorted);
      } catch (err) {
        console.error("Failed to load object classes from public/object_classlist.txt", err);
        setObjectsTypeList([]);
      }
    })();
  }, []);

  useEffect(() => {
    onUpdate(chosenObjects);
  }, [chosenObjects, onUpdate]);

  const filteredObjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return objectsTypeList;
    return objectsTypeList.filter((cn) => cn.toLowerCase().includes(term));
  }, [objectsTypeList, searchTerm]);

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
        <Menu
          placement="right-start" 
          offset={8}
          dismiss={{
            itemPress: false,
          }}
        >
          <MenuHandler>
            <Button variant="outlined" color="blue" className="p-2 w-full">
              Choose objects
            </Button>
          </MenuHandler>
          <MenuList className="max-h-96 w-64 overflow-y-auto">
            <Input
              label="Search objects…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="md"
              color="blue"
            />
            {filteredObjects.length > 0 ? (
              filteredObjects.map((className, index) => (
                <MenuItem
                  key={index}
                  id={className}
                  onClick={() => {
                    setChosenObjects((prev) =>
                      prev.includes(className) ? prev : [...prev, className]
                    );
                    setSearchTerm("");
                  }}
                  className="flex flex-row"
                >
                  <Typography variant="small" color="blue-gray">
                    {className}
                  </Typography>
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled className="opacity-60 cursor-not-allowed">
                <Typography variant="small" color="blue-gray">
                  No matches
                </Typography>
              </MenuItem>
            )}
          </MenuList>
        </Menu>
      </div>
    </Card>
  );
}

export default memo(ObjectsQuery);
