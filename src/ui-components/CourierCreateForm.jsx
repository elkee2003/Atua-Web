/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

/* eslint-disable */
import * as React from "react";
import {
  Badge,
  Button,
  Divider,
  Flex,
  Grid,
  Icon,
  ScrollView,
  SwitchField,
  Text,
  TextField,
  useTheme,
} from "@aws-amplify/ui-react";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { generateClient } from "aws-amplify/api";
import { createCourier } from "../graphql/mutations";
const client = generateClient();
function ArrayField({
  items = [],
  onChange,
  label,
  inputFieldRef,
  children,
  hasError,
  setFieldValue,
  currentFieldValue,
  defaultFieldValue,
  lengthLimit,
  getBadgeText,
  runValidationTasks,
  errorMessage,
}) {
  const labelElement = <Text>{label}</Text>;
  const {
    tokens: {
      components: {
        fieldmessages: { error: errorStyles },
      },
    },
  } = useTheme();
  const [selectedBadgeIndex, setSelectedBadgeIndex] = React.useState();
  const [isEditing, setIsEditing] = React.useState();
  React.useEffect(() => {
    if (isEditing) {
      inputFieldRef?.current?.focus();
    }
  }, [isEditing]);
  const removeItem = async (removeIndex) => {
    const newItems = items.filter((value, index) => index !== removeIndex);
    await onChange(newItems);
    setSelectedBadgeIndex(undefined);
  };
  const addItem = async () => {
    const { hasError } = runValidationTasks();
    if (
      currentFieldValue !== undefined &&
      currentFieldValue !== null &&
      currentFieldValue !== "" &&
      !hasError
    ) {
      const newItems = [...items];
      if (selectedBadgeIndex !== undefined) {
        newItems[selectedBadgeIndex] = currentFieldValue;
        setSelectedBadgeIndex(undefined);
      } else {
        newItems.push(currentFieldValue);
      }
      await onChange(newItems);
      setIsEditing(false);
    }
  };
  const arraySection = (
    <React.Fragment>
      {!!items?.length && (
        <ScrollView height="inherit" width="inherit" maxHeight={"7rem"}>
          {items.map((value, index) => {
            return (
              <Badge
                key={index}
                style={{
                  cursor: "pointer",
                  alignItems: "center",
                  marginRight: 3,
                  marginTop: 3,
                  backgroundColor:
                    index === selectedBadgeIndex ? "#B8CEF9" : "",
                }}
                onClick={() => {
                  setSelectedBadgeIndex(index);
                  setFieldValue(items[index]);
                  setIsEditing(true);
                }}
              >
                {getBadgeText ? getBadgeText(value) : value.toString()}
                <Icon
                  style={{
                    cursor: "pointer",
                    paddingLeft: 3,
                    width: 20,
                    height: 20,
                  }}
                  viewBox={{ width: 20, height: 20 }}
                  paths={[
                    {
                      d: "M10 10l5.09-5.09L10 10l5.09 5.09L10 10zm0 0L4.91 4.91 10 10l-5.09 5.09L10 10z",
                      stroke: "black",
                    },
                  ]}
                  ariaLabel="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeItem(index);
                  }}
                />
              </Badge>
            );
          })}
        </ScrollView>
      )}
      <Divider orientation="horizontal" marginTop={5} />
    </React.Fragment>
  );
  if (lengthLimit !== undefined && items.length >= lengthLimit && !isEditing) {
    return (
      <React.Fragment>
        {labelElement}
        {arraySection}
      </React.Fragment>
    );
  }
  return (
    <React.Fragment>
      {labelElement}
      {isEditing && children}
      {!isEditing ? (
        <>
          <Button
            onClick={() => {
              setIsEditing(true);
            }}
          >
            Add item
          </Button>
          {errorMessage && hasError && (
            <Text color={errorStyles.color} fontSize={errorStyles.fontSize}>
              {errorMessage}
            </Text>
          )}
        </>
      ) : (
        <Flex justifyContent="flex-end">
          {(currentFieldValue || isEditing) && (
            <Button
              children="Cancel"
              type="button"
              size="small"
              onClick={() => {
                setFieldValue(defaultFieldValue);
                setIsEditing(false);
                setSelectedBadgeIndex(undefined);
              }}
            ></Button>
          )}
          <Button size="small" variation="link" onClick={addItem}>
            {selectedBadgeIndex !== undefined ? "Save" : "Add"}
          </Button>
        </Flex>
      )}
      {arraySection}
    </React.Fragment>
  );
}
export default function CourierCreateForm(props) {
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
    isOnline: false,
    firstName: "",
    lastName: "",
    profilePic: "",
    address: "",
    landMark: "",
    phoneNumber: "",
    email: "",
    courierNIN: "",
    courierBVN: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
    transportationType: "",
    vehicleType: "",
    model: "",
    plateNumber: "",
    maxiImages: [],
    maxiTransportPrice: "",
    guarantorName: "",
    guarantorLastName: "",
    guarantorProfession: "",
    guarantorNumber: "",
    guarantorRelationship: "",
    guarantorAddress: "",
    guarantorEmail: "",
    guarantorNIN: "",
    lat: "",
    lng: "",
    heading: "",
    push_token: "",
  };
  const [sub, setSub] = React.useState(initialValues.sub);
  const [isOnline, setIsOnline] = React.useState(initialValues.isOnline);
  const [firstName, setFirstName] = React.useState(initialValues.firstName);
  const [lastName, setLastName] = React.useState(initialValues.lastName);
  const [profilePic, setProfilePic] = React.useState(initialValues.profilePic);
  const [address, setAddress] = React.useState(initialValues.address);
  const [landMark, setLandMark] = React.useState(initialValues.landMark);
  const [phoneNumber, setPhoneNumber] = React.useState(
    initialValues.phoneNumber
  );
  const [email, setEmail] = React.useState(initialValues.email);
  const [courierNIN, setCourierNIN] = React.useState(initialValues.courierNIN);
  const [courierBVN, setCourierBVN] = React.useState(initialValues.courierBVN);
  const [bankName, setBankName] = React.useState(initialValues.bankName);
  const [accountName, setAccountName] = React.useState(
    initialValues.accountName
  );
  const [accountNumber, setAccountNumber] = React.useState(
    initialValues.accountNumber
  );
  const [transportationType, setTransportationType] = React.useState(
    initialValues.transportationType
  );
  const [vehicleType, setVehicleType] = React.useState(
    initialValues.vehicleType
  );
  const [model, setModel] = React.useState(initialValues.model);
  const [plateNumber, setPlateNumber] = React.useState(
    initialValues.plateNumber
  );
  const [maxiImages, setMaxiImages] = React.useState(initialValues.maxiImages);
  const [maxiTransportPrice, setMaxiTransportPrice] = React.useState(
    initialValues.maxiTransportPrice
  );
  const [guarantorName, setGuarantorName] = React.useState(
    initialValues.guarantorName
  );
  const [guarantorLastName, setGuarantorLastName] = React.useState(
    initialValues.guarantorLastName
  );
  const [guarantorProfession, setGuarantorProfession] = React.useState(
    initialValues.guarantorProfession
  );
  const [guarantorNumber, setGuarantorNumber] = React.useState(
    initialValues.guarantorNumber
  );
  const [guarantorRelationship, setGuarantorRelationship] = React.useState(
    initialValues.guarantorRelationship
  );
  const [guarantorAddress, setGuarantorAddress] = React.useState(
    initialValues.guarantorAddress
  );
  const [guarantorEmail, setGuarantorEmail] = React.useState(
    initialValues.guarantorEmail
  );
  const [guarantorNIN, setGuarantorNIN] = React.useState(
    initialValues.guarantorNIN
  );
  const [lat, setLat] = React.useState(initialValues.lat);
  const [lng, setLng] = React.useState(initialValues.lng);
  const [heading, setHeading] = React.useState(initialValues.heading);
  const [push_token, setPush_token] = React.useState(initialValues.push_token);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    setSub(initialValues.sub);
    setIsOnline(initialValues.isOnline);
    setFirstName(initialValues.firstName);
    setLastName(initialValues.lastName);
    setProfilePic(initialValues.profilePic);
    setAddress(initialValues.address);
    setLandMark(initialValues.landMark);
    setPhoneNumber(initialValues.phoneNumber);
    setEmail(initialValues.email);
    setCourierNIN(initialValues.courierNIN);
    setCourierBVN(initialValues.courierBVN);
    setBankName(initialValues.bankName);
    setAccountName(initialValues.accountName);
    setAccountNumber(initialValues.accountNumber);
    setTransportationType(initialValues.transportationType);
    setVehicleType(initialValues.vehicleType);
    setModel(initialValues.model);
    setPlateNumber(initialValues.plateNumber);
    setMaxiImages(initialValues.maxiImages);
    setCurrentMaxiImagesValue("");
    setMaxiTransportPrice(initialValues.maxiTransportPrice);
    setGuarantorName(initialValues.guarantorName);
    setGuarantorLastName(initialValues.guarantorLastName);
    setGuarantorProfession(initialValues.guarantorProfession);
    setGuarantorNumber(initialValues.guarantorNumber);
    setGuarantorRelationship(initialValues.guarantorRelationship);
    setGuarantorAddress(initialValues.guarantorAddress);
    setGuarantorEmail(initialValues.guarantorEmail);
    setGuarantorNIN(initialValues.guarantorNIN);
    setLat(initialValues.lat);
    setLng(initialValues.lng);
    setHeading(initialValues.heading);
    setPush_token(initialValues.push_token);
    setErrors({});
  };
  const [currentMaxiImagesValue, setCurrentMaxiImagesValue] =
    React.useState("");
  const maxiImagesRef = React.createRef();
  const validations = {
    sub: [{ type: "Required" }],
    isOnline: [],
    firstName: [{ type: "Required" }],
    lastName: [],
    profilePic: [],
    address: [],
    landMark: [],
    phoneNumber: [],
    email: [],
    courierNIN: [],
    courierBVN: [],
    bankName: [],
    accountName: [],
    accountNumber: [],
    transportationType: [],
    vehicleType: [],
    model: [],
    plateNumber: [],
    maxiImages: [],
    maxiTransportPrice: [],
    guarantorName: [],
    guarantorLastName: [],
    guarantorProfession: [],
    guarantorNumber: [],
    guarantorRelationship: [],
    guarantorAddress: [],
    guarantorEmail: [],
    guarantorNIN: [],
    lat: [],
    lng: [],
    heading: [],
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
          isOnline,
          firstName,
          lastName,
          profilePic,
          address,
          landMark,
          phoneNumber,
          email,
          courierNIN,
          courierBVN,
          bankName,
          accountName,
          accountNumber,
          transportationType,
          vehicleType,
          model,
          plateNumber,
          maxiImages,
          maxiTransportPrice,
          guarantorName,
          guarantorLastName,
          guarantorProfession,
          guarantorNumber,
          guarantorRelationship,
          guarantorAddress,
          guarantorEmail,
          guarantorNIN,
          lat,
          lng,
          heading,
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
          await client.graphql({
            query: createCourier.replaceAll("__typename", ""),
            variables: {
              input: {
                ...modelFields,
              },
            },
          });
          if (onSuccess) {
            onSuccess(modelFields);
          }
          if (clearOnSuccess) {
            resetStateValues();
          }
        } catch (err) {
          if (onError) {
            const messages = err.errors.map((e) => e.message).join("\n");
            onError(modelFields, messages);
          }
        }
      }}
      {...getOverrideProps(overrides, "CourierCreateForm")}
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
              isOnline,
              firstName,
              lastName,
              profilePic,
              address,
              landMark,
              phoneNumber,
              email,
              courierNIN,
              courierBVN,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleType,
              model,
              plateNumber,
              maxiImages,
              maxiTransportPrice,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              lat,
              lng,
              heading,
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
      <SwitchField
        label="Is online"
        defaultChecked={false}
        isDisabled={false}
        isChecked={isOnline}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              sub,
              isOnline: value,
              firstName,
              lastName,
              profilePic,
              address,
              landMark,
              phoneNumber,
              email,
              courierNIN,
              courierBVN,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleType,
              model,
              plateNumber,
              maxiImages,
              maxiTransportPrice,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              lat,
              lng,
              heading,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.isOnline ?? value;
          }
          if (errors.isOnline?.hasError) {
            runValidationTasks("isOnline", value);
          }
          setIsOnline(value);
        }}
        onBlur={() => runValidationTasks("isOnline", isOnline)}
        errorMessage={errors.isOnline?.errorMessage}
        hasError={errors.isOnline?.hasError}
        {...getOverrideProps(overrides, "isOnline")}
      ></SwitchField>
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
              isOnline,
              firstName: value,
              lastName,
              profilePic,
              address,
              landMark,
              phoneNumber,
              email,
              courierNIN,
              courierBVN,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleType,
              model,
              plateNumber,
              maxiImages,
              maxiTransportPrice,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              lat,
              lng,
              heading,
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
              isOnline,
              firstName,
              lastName: value,
              profilePic,
              address,
              landMark,
              phoneNumber,
              email,
              courierNIN,
              courierBVN,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleType,
              model,
              plateNumber,
              maxiImages,
              maxiTransportPrice,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              lat,
              lng,
              heading,
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
        label="Profile pic"
        isRequired={false}
        isReadOnly={false}
        value={profilePic}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              isOnline,
              firstName,
              lastName,
              profilePic: value,
              address,
              landMark,
              phoneNumber,
              email,
              courierNIN,
              courierBVN,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleType,
              model,
              plateNumber,
              maxiImages,
              maxiTransportPrice,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              lat,
              lng,
              heading,
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
              isOnline,
              firstName,
              lastName,
              profilePic,
              address: value,
              landMark,
              phoneNumber,
              email,
              courierNIN,
              courierBVN,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleType,
              model,
              plateNumber,
              maxiImages,
              maxiTransportPrice,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              lat,
              lng,
              heading,
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
        label="Land mark"
        isRequired={false}
        isReadOnly={false}
        value={landMark}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              isOnline,
              firstName,
              lastName,
              profilePic,
              address,
              landMark: value,
              phoneNumber,
              email,
              courierNIN,
              courierBVN,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleType,
              model,
              plateNumber,
              maxiImages,
              maxiTransportPrice,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              lat,
              lng,
              heading,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.landMark ?? value;
          }
          if (errors.landMark?.hasError) {
            runValidationTasks("landMark", value);
          }
          setLandMark(value);
        }}
        onBlur={() => runValidationTasks("landMark", landMark)}
        errorMessage={errors.landMark?.errorMessage}
        hasError={errors.landMark?.hasError}
        {...getOverrideProps(overrides, "landMark")}
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
              isOnline,
              firstName,
              lastName,
              profilePic,
              address,
              landMark,
              phoneNumber: value,
              email,
              courierNIN,
              courierBVN,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleType,
              model,
              plateNumber,
              maxiImages,
              maxiTransportPrice,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              lat,
              lng,
              heading,
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
        label="Email"
        isRequired={false}
        isReadOnly={false}
        value={email}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              isOnline,
              firstName,
              lastName,
              profilePic,
              address,
              landMark,
              phoneNumber,
              email: value,
              courierNIN,
              courierBVN,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleType,
              model,
              plateNumber,
              maxiImages,
              maxiTransportPrice,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              lat,
              lng,
              heading,
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
        label="Courier nin"
        isRequired={false}
        isReadOnly={false}
        value={courierNIN}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              isOnline,
              firstName,
              lastName,
              profilePic,
              address,
              landMark,
              phoneNumber,
              email,
              courierNIN: value,
              courierBVN,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleType,
              model,
              plateNumber,
              maxiImages,
              maxiTransportPrice,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              lat,
              lng,
              heading,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.courierNIN ?? value;
          }
          if (errors.courierNIN?.hasError) {
            runValidationTasks("courierNIN", value);
          }
          setCourierNIN(value);
        }}
        onBlur={() => runValidationTasks("courierNIN", courierNIN)}
        errorMessage={errors.courierNIN?.errorMessage}
        hasError={errors.courierNIN?.hasError}
        {...getOverrideProps(overrides, "courierNIN")}
      ></TextField>
      <TextField
        label="Courier bvn"
        isRequired={false}
        isReadOnly={false}
        value={courierBVN}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              isOnline,
              firstName,
              lastName,
              profilePic,
              address,
              landMark,
              phoneNumber,
              email,
              courierNIN,
              courierBVN: value,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleType,
              model,
              plateNumber,
              maxiImages,
              maxiTransportPrice,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              lat,
              lng,
              heading,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.courierBVN ?? value;
          }
          if (errors.courierBVN?.hasError) {
            runValidationTasks("courierBVN", value);
          }
          setCourierBVN(value);
        }}
        onBlur={() => runValidationTasks("courierBVN", courierBVN)}
        errorMessage={errors.courierBVN?.errorMessage}
        hasError={errors.courierBVN?.hasError}
        {...getOverrideProps(overrides, "courierBVN")}
      ></TextField>
      <TextField
        label="Bank name"
        isRequired={false}
        isReadOnly={false}
        value={bankName}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              isOnline,
              firstName,
              lastName,
              profilePic,
              address,
              landMark,
              phoneNumber,
              email,
              courierNIN,
              courierBVN,
              bankName: value,
              accountName,
              accountNumber,
              transportationType,
              vehicleType,
              model,
              plateNumber,
              maxiImages,
              maxiTransportPrice,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              lat,
              lng,
              heading,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.bankName ?? value;
          }
          if (errors.bankName?.hasError) {
            runValidationTasks("bankName", value);
          }
          setBankName(value);
        }}
        onBlur={() => runValidationTasks("bankName", bankName)}
        errorMessage={errors.bankName?.errorMessage}
        hasError={errors.bankName?.hasError}
        {...getOverrideProps(overrides, "bankName")}
      ></TextField>
      <TextField
        label="Account name"
        isRequired={false}
        isReadOnly={false}
        value={accountName}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              isOnline,
              firstName,
              lastName,
              profilePic,
              address,
              landMark,
              phoneNumber,
              email,
              courierNIN,
              courierBVN,
              bankName,
              accountName: value,
              accountNumber,
              transportationType,
              vehicleType,
              model,
              plateNumber,
              maxiImages,
              maxiTransportPrice,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              lat,
              lng,
              heading,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.accountName ?? value;
          }
          if (errors.accountName?.hasError) {
            runValidationTasks("accountName", value);
          }
          setAccountName(value);
        }}
        onBlur={() => runValidationTasks("accountName", accountName)}
        errorMessage={errors.accountName?.errorMessage}
        hasError={errors.accountName?.hasError}
        {...getOverrideProps(overrides, "accountName")}
      ></TextField>
      <TextField
        label="Account number"
        isRequired={false}
        isReadOnly={false}
        value={accountNumber}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              isOnline,
              firstName,
              lastName,
              profilePic,
              address,
              landMark,
              phoneNumber,
              email,
              courierNIN,
              courierBVN,
              bankName,
              accountName,
              accountNumber: value,
              transportationType,
              vehicleType,
              model,
              plateNumber,
              maxiImages,
              maxiTransportPrice,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              lat,
              lng,
              heading,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.accountNumber ?? value;
          }
          if (errors.accountNumber?.hasError) {
            runValidationTasks("accountNumber", value);
          }
          setAccountNumber(value);
        }}
        onBlur={() => runValidationTasks("accountNumber", accountNumber)}
        errorMessage={errors.accountNumber?.errorMessage}
        hasError={errors.accountNumber?.hasError}
        {...getOverrideProps(overrides, "accountNumber")}
      ></TextField>
      <TextField
        label="Transportation type"
        isRequired={false}
        isReadOnly={false}
        value={transportationType}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              isOnline,
              firstName,
              lastName,
              profilePic,
              address,
              landMark,
              phoneNumber,
              email,
              courierNIN,
              courierBVN,
              bankName,
              accountName,
              accountNumber,
              transportationType: value,
              vehicleType,
              model,
              plateNumber,
              maxiImages,
              maxiTransportPrice,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              lat,
              lng,
              heading,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.transportationType ?? value;
          }
          if (errors.transportationType?.hasError) {
            runValidationTasks("transportationType", value);
          }
          setTransportationType(value);
        }}
        onBlur={() =>
          runValidationTasks("transportationType", transportationType)
        }
        errorMessage={errors.transportationType?.errorMessage}
        hasError={errors.transportationType?.hasError}
        {...getOverrideProps(overrides, "transportationType")}
      ></TextField>
      <TextField
        label="Vehicle type"
        isRequired={false}
        isReadOnly={false}
        value={vehicleType}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              isOnline,
              firstName,
              lastName,
              profilePic,
              address,
              landMark,
              phoneNumber,
              email,
              courierNIN,
              courierBVN,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleType: value,
              model,
              plateNumber,
              maxiImages,
              maxiTransportPrice,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              lat,
              lng,
              heading,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.vehicleType ?? value;
          }
          if (errors.vehicleType?.hasError) {
            runValidationTasks("vehicleType", value);
          }
          setVehicleType(value);
        }}
        onBlur={() => runValidationTasks("vehicleType", vehicleType)}
        errorMessage={errors.vehicleType?.errorMessage}
        hasError={errors.vehicleType?.hasError}
        {...getOverrideProps(overrides, "vehicleType")}
      ></TextField>
      <TextField
        label="Model"
        isRequired={false}
        isReadOnly={false}
        value={model}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              isOnline,
              firstName,
              lastName,
              profilePic,
              address,
              landMark,
              phoneNumber,
              email,
              courierNIN,
              courierBVN,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleType,
              model: value,
              plateNumber,
              maxiImages,
              maxiTransportPrice,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              lat,
              lng,
              heading,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.model ?? value;
          }
          if (errors.model?.hasError) {
            runValidationTasks("model", value);
          }
          setModel(value);
        }}
        onBlur={() => runValidationTasks("model", model)}
        errorMessage={errors.model?.errorMessage}
        hasError={errors.model?.hasError}
        {...getOverrideProps(overrides, "model")}
      ></TextField>
      <TextField
        label="Plate number"
        isRequired={false}
        isReadOnly={false}
        value={plateNumber}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              isOnline,
              firstName,
              lastName,
              profilePic,
              address,
              landMark,
              phoneNumber,
              email,
              courierNIN,
              courierBVN,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleType,
              model,
              plateNumber: value,
              maxiImages,
              maxiTransportPrice,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              lat,
              lng,
              heading,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.plateNumber ?? value;
          }
          if (errors.plateNumber?.hasError) {
            runValidationTasks("plateNumber", value);
          }
          setPlateNumber(value);
        }}
        onBlur={() => runValidationTasks("plateNumber", plateNumber)}
        errorMessage={errors.plateNumber?.errorMessage}
        hasError={errors.plateNumber?.hasError}
        {...getOverrideProps(overrides, "plateNumber")}
      ></TextField>
      <ArrayField
        onChange={async (items) => {
          let values = items;
          if (onChange) {
            const modelFields = {
              sub,
              isOnline,
              firstName,
              lastName,
              profilePic,
              address,
              landMark,
              phoneNumber,
              email,
              courierNIN,
              courierBVN,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleType,
              model,
              plateNumber,
              maxiImages: values,
              maxiTransportPrice,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              lat,
              lng,
              heading,
              push_token,
            };
            const result = onChange(modelFields);
            values = result?.maxiImages ?? values;
          }
          setMaxiImages(values);
          setCurrentMaxiImagesValue("");
        }}
        currentFieldValue={currentMaxiImagesValue}
        label={"Maxi images"}
        items={maxiImages}
        hasError={errors?.maxiImages?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks("maxiImages", currentMaxiImagesValue)
        }
        errorMessage={errors?.maxiImages?.errorMessage}
        setFieldValue={setCurrentMaxiImagesValue}
        inputFieldRef={maxiImagesRef}
        defaultFieldValue={""}
      >
        <TextField
          label="Maxi images"
          isRequired={false}
          isReadOnly={false}
          value={currentMaxiImagesValue}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.maxiImages?.hasError) {
              runValidationTasks("maxiImages", value);
            }
            setCurrentMaxiImagesValue(value);
          }}
          onBlur={() =>
            runValidationTasks("maxiImages", currentMaxiImagesValue)
          }
          errorMessage={errors.maxiImages?.errorMessage}
          hasError={errors.maxiImages?.hasError}
          ref={maxiImagesRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "maxiImages")}
        ></TextField>
      </ArrayField>
      <TextField
        label="Maxi transport price"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={maxiTransportPrice}
        onChange={(e) => {
          let value = isNaN(parseFloat(e.target.value))
            ? e.target.value
            : parseFloat(e.target.value);
          if (onChange) {
            const modelFields = {
              sub,
              isOnline,
              firstName,
              lastName,
              profilePic,
              address,
              landMark,
              phoneNumber,
              email,
              courierNIN,
              courierBVN,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleType,
              model,
              plateNumber,
              maxiImages,
              maxiTransportPrice: value,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              lat,
              lng,
              heading,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.maxiTransportPrice ?? value;
          }
          if (errors.maxiTransportPrice?.hasError) {
            runValidationTasks("maxiTransportPrice", value);
          }
          setMaxiTransportPrice(value);
        }}
        onBlur={() =>
          runValidationTasks("maxiTransportPrice", maxiTransportPrice)
        }
        errorMessage={errors.maxiTransportPrice?.errorMessage}
        hasError={errors.maxiTransportPrice?.hasError}
        {...getOverrideProps(overrides, "maxiTransportPrice")}
      ></TextField>
      <TextField
        label="Guarantor name"
        isRequired={false}
        isReadOnly={false}
        value={guarantorName}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              isOnline,
              firstName,
              lastName,
              profilePic,
              address,
              landMark,
              phoneNumber,
              email,
              courierNIN,
              courierBVN,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleType,
              model,
              plateNumber,
              maxiImages,
              maxiTransportPrice,
              guarantorName: value,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              lat,
              lng,
              heading,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.guarantorName ?? value;
          }
          if (errors.guarantorName?.hasError) {
            runValidationTasks("guarantorName", value);
          }
          setGuarantorName(value);
        }}
        onBlur={() => runValidationTasks("guarantorName", guarantorName)}
        errorMessage={errors.guarantorName?.errorMessage}
        hasError={errors.guarantorName?.hasError}
        {...getOverrideProps(overrides, "guarantorName")}
      ></TextField>
      <TextField
        label="Guarantor last name"
        isRequired={false}
        isReadOnly={false}
        value={guarantorLastName}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              isOnline,
              firstName,
              lastName,
              profilePic,
              address,
              landMark,
              phoneNumber,
              email,
              courierNIN,
              courierBVN,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleType,
              model,
              plateNumber,
              maxiImages,
              maxiTransportPrice,
              guarantorName,
              guarantorLastName: value,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              lat,
              lng,
              heading,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.guarantorLastName ?? value;
          }
          if (errors.guarantorLastName?.hasError) {
            runValidationTasks("guarantorLastName", value);
          }
          setGuarantorLastName(value);
        }}
        onBlur={() =>
          runValidationTasks("guarantorLastName", guarantorLastName)
        }
        errorMessage={errors.guarantorLastName?.errorMessage}
        hasError={errors.guarantorLastName?.hasError}
        {...getOverrideProps(overrides, "guarantorLastName")}
      ></TextField>
      <TextField
        label="Guarantor profession"
        isRequired={false}
        isReadOnly={false}
        value={guarantorProfession}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              isOnline,
              firstName,
              lastName,
              profilePic,
              address,
              landMark,
              phoneNumber,
              email,
              courierNIN,
              courierBVN,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleType,
              model,
              plateNumber,
              maxiImages,
              maxiTransportPrice,
              guarantorName,
              guarantorLastName,
              guarantorProfession: value,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              lat,
              lng,
              heading,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.guarantorProfession ?? value;
          }
          if (errors.guarantorProfession?.hasError) {
            runValidationTasks("guarantorProfession", value);
          }
          setGuarantorProfession(value);
        }}
        onBlur={() =>
          runValidationTasks("guarantorProfession", guarantorProfession)
        }
        errorMessage={errors.guarantorProfession?.errorMessage}
        hasError={errors.guarantorProfession?.hasError}
        {...getOverrideProps(overrides, "guarantorProfession")}
      ></TextField>
      <TextField
        label="Guarantor number"
        isRequired={false}
        isReadOnly={false}
        value={guarantorNumber}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              isOnline,
              firstName,
              lastName,
              profilePic,
              address,
              landMark,
              phoneNumber,
              email,
              courierNIN,
              courierBVN,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleType,
              model,
              plateNumber,
              maxiImages,
              maxiTransportPrice,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber: value,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              lat,
              lng,
              heading,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.guarantorNumber ?? value;
          }
          if (errors.guarantorNumber?.hasError) {
            runValidationTasks("guarantorNumber", value);
          }
          setGuarantorNumber(value);
        }}
        onBlur={() => runValidationTasks("guarantorNumber", guarantorNumber)}
        errorMessage={errors.guarantorNumber?.errorMessage}
        hasError={errors.guarantorNumber?.hasError}
        {...getOverrideProps(overrides, "guarantorNumber")}
      ></TextField>
      <TextField
        label="Guarantor relationship"
        isRequired={false}
        isReadOnly={false}
        value={guarantorRelationship}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              isOnline,
              firstName,
              lastName,
              profilePic,
              address,
              landMark,
              phoneNumber,
              email,
              courierNIN,
              courierBVN,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleType,
              model,
              plateNumber,
              maxiImages,
              maxiTransportPrice,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship: value,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              lat,
              lng,
              heading,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.guarantorRelationship ?? value;
          }
          if (errors.guarantorRelationship?.hasError) {
            runValidationTasks("guarantorRelationship", value);
          }
          setGuarantorRelationship(value);
        }}
        onBlur={() =>
          runValidationTasks("guarantorRelationship", guarantorRelationship)
        }
        errorMessage={errors.guarantorRelationship?.errorMessage}
        hasError={errors.guarantorRelationship?.hasError}
        {...getOverrideProps(overrides, "guarantorRelationship")}
      ></TextField>
      <TextField
        label="Guarantor address"
        isRequired={false}
        isReadOnly={false}
        value={guarantorAddress}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              isOnline,
              firstName,
              lastName,
              profilePic,
              address,
              landMark,
              phoneNumber,
              email,
              courierNIN,
              courierBVN,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleType,
              model,
              plateNumber,
              maxiImages,
              maxiTransportPrice,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress: value,
              guarantorEmail,
              guarantorNIN,
              lat,
              lng,
              heading,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.guarantorAddress ?? value;
          }
          if (errors.guarantorAddress?.hasError) {
            runValidationTasks("guarantorAddress", value);
          }
          setGuarantorAddress(value);
        }}
        onBlur={() => runValidationTasks("guarantorAddress", guarantorAddress)}
        errorMessage={errors.guarantorAddress?.errorMessage}
        hasError={errors.guarantorAddress?.hasError}
        {...getOverrideProps(overrides, "guarantorAddress")}
      ></TextField>
      <TextField
        label="Guarantor email"
        isRequired={false}
        isReadOnly={false}
        value={guarantorEmail}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              isOnline,
              firstName,
              lastName,
              profilePic,
              address,
              landMark,
              phoneNumber,
              email,
              courierNIN,
              courierBVN,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleType,
              model,
              plateNumber,
              maxiImages,
              maxiTransportPrice,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail: value,
              guarantorNIN,
              lat,
              lng,
              heading,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.guarantorEmail ?? value;
          }
          if (errors.guarantorEmail?.hasError) {
            runValidationTasks("guarantorEmail", value);
          }
          setGuarantorEmail(value);
        }}
        onBlur={() => runValidationTasks("guarantorEmail", guarantorEmail)}
        errorMessage={errors.guarantorEmail?.errorMessage}
        hasError={errors.guarantorEmail?.hasError}
        {...getOverrideProps(overrides, "guarantorEmail")}
      ></TextField>
      <TextField
        label="Guarantor nin"
        isRequired={false}
        isReadOnly={false}
        value={guarantorNIN}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              isOnline,
              firstName,
              lastName,
              profilePic,
              address,
              landMark,
              phoneNumber,
              email,
              courierNIN,
              courierBVN,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleType,
              model,
              plateNumber,
              maxiImages,
              maxiTransportPrice,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN: value,
              lat,
              lng,
              heading,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.guarantorNIN ?? value;
          }
          if (errors.guarantorNIN?.hasError) {
            runValidationTasks("guarantorNIN", value);
          }
          setGuarantorNIN(value);
        }}
        onBlur={() => runValidationTasks("guarantorNIN", guarantorNIN)}
        errorMessage={errors.guarantorNIN?.errorMessage}
        hasError={errors.guarantorNIN?.hasError}
        {...getOverrideProps(overrides, "guarantorNIN")}
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
              isOnline,
              firstName,
              lastName,
              profilePic,
              address,
              landMark,
              phoneNumber,
              email,
              courierNIN,
              courierBVN,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleType,
              model,
              plateNumber,
              maxiImages,
              maxiTransportPrice,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              lat: value,
              lng,
              heading,
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
              isOnline,
              firstName,
              lastName,
              profilePic,
              address,
              landMark,
              phoneNumber,
              email,
              courierNIN,
              courierBVN,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleType,
              model,
              plateNumber,
              maxiImages,
              maxiTransportPrice,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              lat,
              lng: value,
              heading,
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
      <TextField
        label="Heading"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={heading}
        onChange={(e) => {
          let value = isNaN(parseFloat(e.target.value))
            ? e.target.value
            : parseFloat(e.target.value);
          if (onChange) {
            const modelFields = {
              sub,
              isOnline,
              firstName,
              lastName,
              profilePic,
              address,
              landMark,
              phoneNumber,
              email,
              courierNIN,
              courierBVN,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleType,
              model,
              plateNumber,
              maxiImages,
              maxiTransportPrice,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              lat,
              lng,
              heading: value,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.heading ?? value;
          }
          if (errors.heading?.hasError) {
            runValidationTasks("heading", value);
          }
          setHeading(value);
        }}
        onBlur={() => runValidationTasks("heading", heading)}
        errorMessage={errors.heading?.errorMessage}
        hasError={errors.heading?.hasError}
        {...getOverrideProps(overrides, "heading")}
      ></TextField>
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
              isOnline,
              firstName,
              lastName,
              profilePic,
              address,
              landMark,
              phoneNumber,
              email,
              courierNIN,
              courierBVN,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleType,
              model,
              plateNumber,
              maxiImages,
              maxiTransportPrice,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              lat,
              lng,
              heading,
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
