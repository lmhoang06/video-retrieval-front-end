"use client";

import {
  Button,
  CardBody,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Typography,
  Input,
} from "@material-tailwind/react";
import { Chip } from "@material-tailwind/react";
import { Card, CardHeader } from "@material-tailwind/react";
import React, { useState, useCallback, memo, useEffect } from "react";
import { useApp } from "@/contexts/appContext";
import { useMsal } from "@azure/msal-react";
import axios from "axios";
import processQueryResult from "./processQueryResult";

const ObjectChosenInfo = memo(
  ({ className, objectClassName, numberOfObject }) => {
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

function ObjectsSearch({ className }) {
  const [chosenObjects, setChosenObjects] = useState([]);
  const [objectsTypeList, setObjectsTypeList] = useState([]);
  const { setImages } = useApp();
  const { instance, accounts } = useMsal();

  useEffect(() => {
    (async function getObjectsClassName() {
      setObjectsTypeList((await axios.get("/api/objects/classList")).data);
    })();
  }, []);

  const handleOnClick = async () => {
    // On progess
    let requestData = {};
    chosenObjects.forEach(({ className, number }) => {
      requestData[className] = number;
    });
    let response = await axios.post("/api/objects/query", requestData);

    const accessToken = (
      await instance.acquireTokenSilent({
        scopes: ["User.ReadBasic.All", "Files.ReadWrite.All"],
        account: accounts[0],
      })
    )?.accessToken;

    if (!accessToken) {
      throw new Error("Invalid access token!");
    }

    setImages(await processQueryResult(accessToken, response.data, 16));
  };

  return (
    <Card className={className}>
      <CardHeader>
        <Typography variant="lead" color="blue-gray" className="text-center">
          Objects Search
        </Typography>
      </CardHeader>
      <CardBody>
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
              <Button
                variant="outlined"
                color="blue"
                className="p-2 w-full"
              >
                Choose objects
              </Button>
            </MenuHandler>
            <MenuList className="max-h-72 w-60">
              {objectsTypeList.map(({ className, count }, index) => (
                <MenuItem
                  key={index}
                  id={className}
                  onClick={(e) => {
                    if (e.target.id) {
                      setChosenObjects((prev) =>
                        prev.some((obj) => obj.className === e.target.id)
                          ? prev
                          : [...prev, { className: e.target.id, number: 0 }]
                      );
                    }
                  }}
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

          <Button
            variant="outlined"
            color="blue"
            className="p-2 w-full"
            onClick={handleOnClick}
          >
            Submit Query
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

export default memo(ObjectsSearch);
