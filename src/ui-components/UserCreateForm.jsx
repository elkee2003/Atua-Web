/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

/* eslint-disable */
import * as React from "react";
import {
  Button,
  Flex,
  Grid,
  SwitchField,
  TextField,
} from "@aws-amplify/ui-react";
import { User } from "../models";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { DataStore } from "aws-amplify/datastore";
export default function UserCreateForm(props) {
  const {
    clearOnSuccess = true,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    sub: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    profilePic: "",
    address: "",
    exactAddress: "",
    lat: "",
    lng: "",
    isBlocked: false,
    push_token: "",
  };
  const [sub, setSub] = React.useState(initialValues.sub);
  const [firstName, setFirstName] = React.useState(initialValues.firstName);
  const [lastName, setLastName] = React.useState(initialValues.lastName);
  const [email, setEmail] = React.useState(initialValues.email);
  const [phoneNumber, setPhoneNumber] = React.useState(
    initialValues.phoneNumber
  );
  const [profilePic, setProfilePic] = React.useState(initialValues.profilePic);
  const [address, setAddress] = React.useState(initialValues.address);
  const [exactAddress, setExactAddress] = React.useState(
    initialValues.exactAddress
  );
  const [lat, setLat] = React.useState(initialValues.lat);
  const [lng, setLng] = React.useState(initialValues.lng);
  const [isBlocked, setIsBlocked] = React.useState(initialValues.isBlocked);
  const [push_token, setPush_token] = React.useState(initialValues.push_token);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    setSub(initialValues.sub);
    setFirstName(initialValues.firstName);
    setLastName(initialValues.lastName);
    setEmail(initialValues.email);
    setPhoneNumber(initialValues.phoneNumber);
    setProfilePic(initialValues.profilePic);
    setAddress(initialValues.address);
    setExactAddress(initialValues.exactAddress);
    setLat(initialValues.lat);
    setLng(initialValues.lng);
    setIsBlocked(initialValues.isBlocked);
    setPush_token(initialValues.push_token);
    setErrors({});
  };
  const validations = {
    sub: [{ type: "Required" }],
    firstName: [{ type: "Required" }],
    lastName: [],
    email: [],
    phoneNumber: [],
    profilePic: [],
    address: [],
    exactAddress: [],
    lat: [],
    lng: [],
    isBlocked: [],
    push_token: [],
  };
  const runValidationTasks = async (
    fieldName,
    currentValue,
    getDisplayValue
  ) => {
    const value =
      currentValue && getDisplayValue
        ? getDisplayValue(currentValue)
        : currentValue;
    let validationResponse = validateField(value, validations[fieldName]);
    const customValidator = fetchByPath(onValidate, fieldName);
    if (customValidator) {
      validationResponse = await customValidator(value, validationResponse);
    }
    setErrors((errors) => ({ ...errors, [fieldName]: validationResponse }));
    return validationResponse;
  };
  return (
    <Grid
      as="form"
      rowGap="15px"
      columnGap="15px"
      padding="20px"
      onSubmit={async (event) => {
        event.preventDefault();
        let modelFields = {
          sub,
          firstName,
          lastName,
          email,
          phoneNumber,
          profilePic,
          address,
          exactAddress,
          lat,
          lng,
          isBlocked,
          push_token,
        };
        const validationResponses = await Promise.all(
          Object.keys(validations).reduce((promises, fieldName) => {
            if (Array.isArray(modelFields[fieldName])) {
              promises.push(
                ...modelFields[fieldName].map((item) =>
                  runValidationTasks(fieldName, item)
                )
              );
              return promises;
            }
            promises.push(
              runValidationTasks(fieldName, modelFields[fieldName])
            );
            return promises;
          }, [])
        );
        if (validationResponses.some((r) => r.hasError)) {
          return;
        }
        if (onSubmit) {
          modelFields = onSubmit(modelFields);
        }
        try {
          Object.entries(modelFields).forEach(([key, value]) => {
            if (typeof value === "string" && value === "") {
              modelFields[key] = null;
            }
          });
          await DataStore.save(new User(modelFields));
          if (onSuccess) {
            onSuccess(modelFields);
          }
          if (clearOnSuccess) {
            resetStateValues();
          }
        } catch (err) {
          if (onError) {
            onError(modelFields, err.message);
          }
        }
      }}
      {...getOverrideProps(overrides, "UserCreateForm")}
      {...rest}
    >
      <TextField
        label="Sub"
        isRequired={true}
        isReadOnly={false}
        value={sub}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub: value,
              firstName,
              lastName,
              email,
              phoneNumber,
              profilePic,
              address,
              exactAddress,
              lat,
              lng,
              isBlocked,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.sub ?? value;
          }
          if (errors.sub?.hasError) {
            runValidationTasks("sub", value);
          }
          setSub(value);
        }}
        onBlur={() => runValidationTasks("sub", sub)}
        errorMessage={errors.sub?.errorMessage}
        hasError={errors.sub?.hasError}
        {...getOverrideProps(overrides, "sub")}
      ></TextField>
      <TextField
        label="First name"
        isRequired={true}
        isReadOnly={false}
        value={firstName}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              firstName: value,
              lastName,
              email,
              phoneNumber,
              profilePic,
              address,
              exactAddress,
              lat,
              lng,
              isBlocked,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.firstName ?? value;
          }
          if (errors.firstName?.hasError) {
            runValidationTasks("firstName", value);
          }
          setFirstName(value);
        }}
        onBlur={() => runValidationTasks("firstName", firstName)}
        errorMessage={errors.firstName?.errorMessage}
        hasError={errors.firstName?.hasError}
        {...getOverrideProps(overrides, "firstName")}
      ></TextField>
      <TextField
        label="Last name"
        isRequired={false}
        isReadOnly={false}
        value={lastName}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              firstName,
              lastName: value,
              email,
              phoneNumber,
              profilePic,
              address,
              exactAddress,
              lat,
              lng,
              isBlocked,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.lastName ?? value;
          }
          if (errors.lastName?.hasError) {
            runValidationTasks("lastName", value);
          }
          setLastName(value);
        }}
        onBlur={() => runValidationTasks("lastName", lastName)}
        errorMessage={errors.lastName?.errorMessage}
        hasError={errors.lastName?.hasError}
        {...getOverrideProps(overrides, "lastName")}
      ></TextField>
      <TextField
        label="Email"
        isRequired={false}
        isReadOnly={false}
        value={email}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              firstName,
              lastName,
              email: value,
              phoneNumber,
              profilePic,
              address,
              exactAddress,
              lat,
              lng,
              isBlocked,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.email ?? value;
          }
          if (errors.email?.hasError) {
            runValidationTasks("email", value);
          }
          setEmail(value);
        }}
        onBlur={() => runValidationTasks("email", email)}
        errorMessage={errors.email?.errorMessage}
        hasError={errors.email?.hasError}
        {...getOverrideProps(overrides, "email")}
      ></TextField>
      <TextField
        label="Phone number"
        isRequired={false}
        isReadOnly={false}
        value={phoneNumber}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              firstName,
              lastName,
              email,
              phoneNumber: value,
              profilePic,
              address,
              exactAddress,
              lat,
              lng,
              isBlocked,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.phoneNumber ?? value;
          }
          if (errors.phoneNumber?.hasError) {
            runValidationTasks("phoneNumber", value);
          }
          setPhoneNumber(value);
        }}
        onBlur={() => runValidationTasks("phoneNumber", phoneNumber)}
        errorMessage={errors.phoneNumber?.errorMessage}
        hasError={errors.phoneNumber?.hasError}
        {...getOverrideProps(overrides, "phoneNumber")}
      ></TextField>
      <TextField
        label="Profile pic"
        isRequired={false}
        isReadOnly={false}
        value={profilePic}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              firstName,
              lastName,
              email,
              phoneNumber,
              profilePic: value,
              address,
              exactAddress,
              lat,
              lng,
              isBlocked,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.profilePic ?? value;
          }
          if (errors.profilePic?.hasError) {
            runValidationTasks("profilePic", value);
          }
          setProfilePic(value);
        }}
        onBlur={() => runValidationTasks("profilePic", profilePic)}
        errorMessage={errors.profilePic?.errorMessage}
        hasError={errors.profilePic?.hasError}
        {...getOverrideProps(overrides, "profilePic")}
      ></TextField>
      <TextField
        label="Address"
        isRequired={false}
        isReadOnly={false}
        value={address}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              firstName,
              lastName,
              email,
              phoneNumber,
              profilePic,
              address: value,
              exactAddress,
              lat,
              lng,
              isBlocked,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.address ?? value;
          }
          if (errors.address?.hasError) {
            runValidationTasks("address", value);
          }
          setAddress(value);
        }}
        onBlur={() => runValidationTasks("address", address)}
        errorMessage={errors.address?.errorMessage}
        hasError={errors.address?.hasError}
        {...getOverrideProps(overrides, "address")}
      ></TextField>
      <TextField
        label="Exact address"
        isRequired={false}
        isReadOnly={false}
        value={exactAddress}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              firstName,
              lastName,
              email,
              phoneNumber,
              profilePic,
              address,
              exactAddress: value,
              lat,
              lng,
              isBlocked,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.exactAddress ?? value;
          }
          if (errors.exactAddress?.hasError) {
            runValidationTasks("exactAddress", value);
          }
          setExactAddress(value);
        }}
        onBlur={() => runValidationTasks("exactAddress", exactAddress)}
        errorMessage={errors.exactAddress?.errorMessage}
        hasError={errors.exactAddress?.hasError}
        {...getOverrideProps(overrides, "exactAddress")}
      ></TextField>
      <TextField
        label="Lat"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={lat}
        onChange={(e) => {
          let value = isNaN(parseFloat(e.target.value))
            ? e.target.value
            : parseFloat(e.target.value);
          if (onChange) {
            const modelFields = {
              sub,
              firstName,
              lastName,
              email,
              phoneNumber,
              profilePic,
              address,
              exactAddress,
              lat: value,
              lng,
              isBlocked,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.lat ?? value;
          }
          if (errors.lat?.hasError) {
            runValidationTasks("lat", value);
          }
          setLat(value);
        }}
        onBlur={() => runValidationTasks("lat", lat)}
        errorMessage={errors.lat?.errorMessage}
        hasError={errors.lat?.hasError}
        {...getOverrideProps(overrides, "lat")}
      ></TextField>
      <TextField
        label="Lng"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={lng}
        onChange={(e) => {
          let value = isNaN(parseFloat(e.target.value))
            ? e.target.value
            : parseFloat(e.target.value);
          if (onChange) {
            const modelFields = {
              sub,
              firstName,
              lastName,
              email,
              phoneNumber,
              profilePic,
              address,
              exactAddress,
              lat,
              lng: value,
              isBlocked,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.lng ?? value;
          }
          if (errors.lng?.hasError) {
            runValidationTasks("lng", value);
          }
          setLng(value);
        }}
        onBlur={() => runValidationTasks("lng", lng)}
        errorMessage={errors.lng?.errorMessage}
        hasError={errors.lng?.hasError}
        {...getOverrideProps(overrides, "lng")}
      ></TextField>
      <SwitchField
        label="Is blocked"
        defaultChecked={false}
        isDisabled={false}
        isChecked={isBlocked}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              sub,
              firstName,
              lastName,
              email,
              phoneNumber,
              profilePic,
              address,
              exactAddress,
              lat,
              lng,
              isBlocked: value,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.isBlocked ?? value;
          }
          if (errors.isBlocked?.hasError) {
            runValidationTasks("isBlocked", value);
          }
          setIsBlocked(value);
        }}
        onBlur={() => runValidationTasks("isBlocked", isBlocked)}
        errorMessage={errors.isBlocked?.errorMessage}
        hasError={errors.isBlocked?.hasError}
        {...getOverrideProps(overrides, "isBlocked")}
      ></SwitchField>
      <TextField
        label="Push token"
        isRequired={false}
        isReadOnly={false}
        value={push_token}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              firstName,
              lastName,
              email,
              phoneNumber,
              profilePic,
              address,
              exactAddress,
              lat,
              lng,
              isBlocked,
              push_token: value,
            };
            const result = onChange(modelFields);
            value = result?.push_token ?? value;
          }
          if (errors.push_token?.hasError) {
            runValidationTasks("push_token", value);
          }
          setPush_token(value);
        }}
        onBlur={() => runValidationTasks("push_token", push_token)}
        errorMessage={errors.push_token?.errorMessage}
        hasError={errors.push_token?.hasError}
        {...getOverrideProps(overrides, "push_token")}
      ></TextField>
      <Flex
        justifyContent="space-between"
        {...getOverrideProps(overrides, "CTAFlex")}
      >
        <Button
          children="Clear"
          type="reset"
          onClick={(event) => {
            event.preventDefault();
            resetStateValues();
          }}
          {...getOverrideProps(overrides, "ClearButton")}
        ></Button>
        <Flex
          gap="15px"
          {...getOverrideProps(overrides, "RightAlignCTASubFlex")}
        >
          <Button
            children="Submit"
            type="submit"
            variation="primary"
            isDisabled={Object.values(errors).some((e) => e?.hasError)}
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
