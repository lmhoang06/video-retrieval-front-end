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
  const [includeObjects, setIncludeObjects] = useState([]);
  const [excludeObjects, setExcludeObjects] = useState([]);
  const [confidence, setConfidence] = useState(0);
  const [objectsTypeList, setObjectsTypeList] = useState([]);
  const [searchInclude, setSearchInclude] = useState("");
  const [searchExclude, setSearchExclude] = useState("");

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

  // Emit combined filter object upward
  useEffect(() => {
    onUpdate({ include: includeObjects, exclude: excludeObjects, confidence });
  }, [includeObjects, excludeObjects, confidence, onUpdate]);

  const filteredIncludeList = useMemo(() => {
    const term = searchInclude.trim().toLowerCase();
    const base = !term
      ? objectsTypeList
      : objectsTypeList.filter((cn) => cn.toLowerCase().includes(term));
    return base.filter((cn) => !excludeObjects.includes(cn)); // hide ones already excluded
  }, [objectsTypeList, searchInclude, excludeObjects]);

  const filteredExcludeList = useMemo(() => {
    const term = searchExclude.trim().toLowerCase();
    const base = !term
      ? objectsTypeList
      : objectsTypeList.filter((cn) => cn.toLowerCase().includes(term));
    return base.filter((cn) => !includeObjects.includes(cn)); // hide ones already included
  }, [objectsTypeList, searchExclude, includeObjects]);

  return (
    <Card className={className}>
      {/* Confidence threshold */}
      <div className="mb-3">
        <Input
          type="number"
          label="Confidence ≥"
            size="md"
          value={confidence}
          step={0.01}
          min={0}
          max={1}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (Number.isNaN(v)) {
              setConfidence(0);
            } else {
              setConfidence(Math.min(1, Math.max(0, v)));
            }
          }}
        />
      </div>

      {/* Include objects section */}
      <div>
        <Typography variant="h6" color="blue-gray">Include Objects</Typography>
        <div className="flex flex-col gap-1 overflow-y-auto max-h-40 mt-1">
          {includeObjects.map((className, index) => (
            <Chip
              variant="outlined"
              color="green"
              size="md"
              key={index}
              className="py-0"
              value={<ObjectChosenInfo objectClassName={className} />}
              onClose={() =>
                setIncludeObjects((prev) => prev.filter((cn) => cn !== className))
              }
            />
          ))}
          {includeObjects.length === 0 && (
            <Typography variant="small" className="text-blue-gray-400">None selected</Typography>
          )}
        </div>
        <div className="flex flex-col gap-1 mt-2">
          <Menu placement="right-start" offset={8} dismiss={{ itemPress: false }}>
            <MenuHandler>
              <Button variant="outlined" color="blue" className="p-2 w-full">
                Add Include
              </Button>
            </MenuHandler>
            <MenuList className="max-h-96 w-64 overflow-y-auto">
              <Input
                label="Search…"
                value={searchInclude}
                onChange={(e) => setSearchInclude(e.target.value)}
                size="md"
                color="blue"
              />
              {filteredIncludeList.length > 0 ? (
                filteredIncludeList.map((className, index) => (
                  <MenuItem
                    key={index}
                    id={className}
                    onClick={() => {
                      setIncludeObjects((prev) =>
                        prev.includes(className) ? prev : [...prev, className]
                      );
                      setSearchInclude("");
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
      </div>

      {/* Exclude objects section */}
      <div className="mt-6">
        <Typography variant="h6" color="blue-gray">Exclude Objects</Typography>
        <div className="flex flex-col gap-1 overflow-y-auto max-h-40 mt-1">
          {excludeObjects.map((className, index) => (
            <Chip
              variant="outlined"
              color="red"
              size="md"
              key={index}
              className="py-0"
              value={<ObjectChosenInfo objectClassName={className} />}
              onClose={() =>
                setExcludeObjects((prev) => prev.filter((cn) => cn !== className))
              }
            />
          ))}
          {excludeObjects.length === 0 && (
            <Typography variant="small" className="text-blue-gray-400">None selected</Typography>
          )}
        </div>
        <div className="flex flex-col gap-1 mt-2">
          <Menu placement="right-start" offset={8} dismiss={{ itemPress: false }}>
            <MenuHandler>
              <Button variant="outlined" color="blue" className="p-2 w-full">
                Add Exclude
              </Button>
            </MenuHandler>
            <MenuList className="max-h-96 w-64 overflow-y-auto">
              <Input
                label="Search…"
                value={searchExclude}
                onChange={(e) => setSearchExclude(e.target.value)}
                size="md"
                color="blue"
              />
              {filteredExcludeList.length > 0 ? (
                filteredExcludeList.map((className, index) => (
                  <MenuItem
                    key={index}
                    id={className}
                    onClick={() => {
                      setExcludeObjects((prev) =>
                        prev.includes(className) ? prev : [...prev, className]
                      );
                      setSearchExclude("");
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
      </div>
    </Card>
  );
}

export default memo(ObjectsQuery);
