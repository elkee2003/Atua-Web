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
import { Courier } from "../models";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { DataStore } from "aws-amplify/datastore";
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
    courierNINImage: "",
    bankCode: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
    transportationType: "",
    vehicleClass: "",
    model: "",
    vehicleColour: "",
    plateNumber: "",
    maxiImages: [],
    maxiDescription: "",
    guarantorName: "",
    guarantorLastName: "",
    guarantorProfession: "",
    guarantorNumber: "",
    guarantorRelationship: "",
    guarantorAddress: "",
    guarantorEmail: "",
    guarantorNIN: "",
    guarantorNINImage: "",
    lat: "",
    lng: "",
    heading: "",
    push_token: "",
    isApproved: false,
    approvedById: "",
    currentBatchCount: "",
    currentExpressCount: "",
    currentMaxiCount: "",
    lastBatchAssignedAt: "",
    statusKey: "",
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
  const [courierNINImage, setCourierNINImage] = React.useState(
    initialValues.courierNINImage
  );
  const [bankCode, setBankCode] = React.useState(initialValues.bankCode);
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
  const [vehicleClass, setVehicleClass] = React.useState(
    initialValues.vehicleClass
  );
  const [model, setModel] = React.useState(initialValues.model);
  const [vehicleColour, setVehicleColour] = React.useState(
    initialValues.vehicleColour
  );
  const [plateNumber, setPlateNumber] = React.useState(
    initialValues.plateNumber
  );
  const [maxiImages, setMaxiImages] = React.useState(initialValues.maxiImages);
  const [maxiDescription, setMaxiDescription] = React.useState(
    initialValues.maxiDescription
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
  const [guarantorNINImage, setGuarantorNINImage] = React.useState(
    initialValues.guarantorNINImage
  );
  const [lat, setLat] = React.useState(initialValues.lat);
  const [lng, setLng] = React.useState(initialValues.lng);
  const [heading, setHeading] = React.useState(initialValues.heading);
  const [push_token, setPush_token] = React.useState(initialValues.push_token);
  const [isApproved, setIsApproved] = React.useState(initialValues.isApproved);
  const [approvedById, setApprovedById] = React.useState(
    initialValues.approvedById
  );
  const [currentBatchCount, setCurrentBatchCount] = React.useState(
    initialValues.currentBatchCount
  );
  const [currentExpressCount, setCurrentExpressCount] = React.useState(
    initialValues.currentExpressCount
  );
  const [currentMaxiCount, setCurrentMaxiCount] = React.useState(
    initialValues.currentMaxiCount
  );
  const [lastBatchAssignedAt, setLastBatchAssignedAt] = React.useState(
    initialValues.lastBatchAssignedAt
  );
  const [statusKey, setStatusKey] = React.useState(initialValues.statusKey);
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
    setCourierNINImage(initialValues.courierNINImage);
    setBankCode(initialValues.bankCode);
    setBankName(initialValues.bankName);
    setAccountName(initialValues.accountName);
    setAccountNumber(initialValues.accountNumber);
    setTransportationType(initialValues.transportationType);
    setVehicleClass(initialValues.vehicleClass);
    setModel(initialValues.model);
    setVehicleColour(initialValues.vehicleColour);
    setPlateNumber(initialValues.plateNumber);
    setMaxiImages(initialValues.maxiImages);
    setCurrentMaxiImagesValue("");
    setMaxiDescription(initialValues.maxiDescription);
    setGuarantorName(initialValues.guarantorName);
    setGuarantorLastName(initialValues.guarantorLastName);
    setGuarantorProfession(initialValues.guarantorProfession);
    setGuarantorNumber(initialValues.guarantorNumber);
    setGuarantorRelationship(initialValues.guarantorRelationship);
    setGuarantorAddress(initialValues.guarantorAddress);
    setGuarantorEmail(initialValues.guarantorEmail);
    setGuarantorNIN(initialValues.guarantorNIN);
    setGuarantorNINImage(initialValues.guarantorNINImage);
    setLat(initialValues.lat);
    setLng(initialValues.lng);
    setHeading(initialValues.heading);
    setPush_token(initialValues.push_token);
    setIsApproved(initialValues.isApproved);
    setApprovedById(initialValues.approvedById);
    setCurrentBatchCount(initialValues.currentBatchCount);
    setCurrentExpressCount(initialValues.currentExpressCount);
    setCurrentMaxiCount(initialValues.currentMaxiCount);
    setLastBatchAssignedAt(initialValues.lastBatchAssignedAt);
    setStatusKey(initialValues.statusKey);
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
    courierNINImage: [],
    bankCode: [],
    bankName: [],
    accountName: [],
    accountNumber: [],
    transportationType: [],
    vehicleClass: [],
    model: [],
    vehicleColour: [],
    plateNumber: [],
    maxiImages: [],
    maxiDescription: [],
    guarantorName: [],
    guarantorLastName: [],
    guarantorProfession: [],
    guarantorNumber: [],
    guarantorRelationship: [],
    guarantorAddress: [],
    guarantorEmail: [],
    guarantorNIN: [],
    guarantorNINImage: [],
    lat: [],
    lng: [],
    heading: [],
    push_token: [],
    isApproved: [],
    approvedById: [],
    currentBatchCount: [],
    currentExpressCount: [],
    currentMaxiCount: [],
    lastBatchAssignedAt: [],
    statusKey: [],
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
  const convertToLocal = (date) => {
    const df = new Intl.DateTimeFormat("default", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      calendar: "iso8601",
      numberingSystem: "latn",
      hourCycle: "h23",
    });
    const parts = df.formatToParts(date).reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
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
          courierNINImage,
          bankCode,
          bankName,
          accountName,
          accountNumber,
          transportationType,
          vehicleClass,
          model,
          vehicleColour,
          plateNumber,
          maxiImages,
          maxiDescription,
          guarantorName,
          guarantorLastName,
          guarantorProfession,
          guarantorNumber,
          guarantorRelationship,
          guarantorAddress,
          guarantorEmail,
          guarantorNIN,
          guarantorNINImage,
          lat,
          lng,
          heading,
          push_token,
          isApproved,
          approvedById,
          currentBatchCount,
          currentExpressCount,
          currentMaxiCount,
          lastBatchAssignedAt,
          statusKey,
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
          await DataStore.save(new Courier(modelFields));
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
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
        label="Courier nin image"
        isRequired={false}
        isReadOnly={false}
        value={courierNINImage}
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
              courierNINImage: value,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
            };
            const result = onChange(modelFields);
            value = result?.courierNINImage ?? value;
          }
          if (errors.courierNINImage?.hasError) {
            runValidationTasks("courierNINImage", value);
          }
          setCourierNINImage(value);
        }}
        onBlur={() => runValidationTasks("courierNINImage", courierNINImage)}
        errorMessage={errors.courierNINImage?.errorMessage}
        hasError={errors.courierNINImage?.hasError}
        {...getOverrideProps(overrides, "courierNINImage")}
      ></TextField>
      <TextField
        label="Bank code"
        isRequired={false}
        isReadOnly={false}
        value={bankCode}
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
              courierNINImage,
              bankCode: value,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
            };
            const result = onChange(modelFields);
            value = result?.bankCode ?? value;
          }
          if (errors.bankCode?.hasError) {
            runValidationTasks("bankCode", value);
          }
          setBankCode(value);
        }}
        onBlur={() => runValidationTasks("bankCode", bankCode)}
        errorMessage={errors.bankCode?.errorMessage}
        hasError={errors.bankCode?.hasError}
        {...getOverrideProps(overrides, "bankCode")}
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
              courierNINImage,
              bankCode,
              bankName: value,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
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
              courierNINImage,
              bankCode,
              bankName,
              accountName: value,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber: value,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType: value,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
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
        label="Vehicle class"
        isRequired={false}
        isReadOnly={false}
        value={vehicleClass}
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass: value,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
            };
            const result = onChange(modelFields);
            value = result?.vehicleClass ?? value;
          }
          if (errors.vehicleClass?.hasError) {
            runValidationTasks("vehicleClass", value);
          }
          setVehicleClass(value);
        }}
        onBlur={() => runValidationTasks("vehicleClass", vehicleClass)}
        errorMessage={errors.vehicleClass?.errorMessage}
        hasError={errors.vehicleClass?.hasError}
        {...getOverrideProps(overrides, "vehicleClass")}
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model: value,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
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
        label="Vehicle colour"
        isRequired={false}
        isReadOnly={false}
        value={vehicleColour}
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour: value,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
            };
            const result = onChange(modelFields);
            value = result?.vehicleColour ?? value;
          }
          if (errors.vehicleColour?.hasError) {
            runValidationTasks("vehicleColour", value);
          }
          setVehicleColour(value);
        }}
        onBlur={() => runValidationTasks("vehicleColour", vehicleColour)}
        errorMessage={errors.vehicleColour?.errorMessage}
        hasError={errors.vehicleColour?.hasError}
        {...getOverrideProps(overrides, "vehicleColour")}
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber: value,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages: values,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
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
        label="Maxi description"
        isRequired={false}
        isReadOnly={false}
        value={maxiDescription}
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription: value,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
            };
            const result = onChange(modelFields);
            value = result?.maxiDescription ?? value;
          }
          if (errors.maxiDescription?.hasError) {
            runValidationTasks("maxiDescription", value);
          }
          setMaxiDescription(value);
        }}
        onBlur={() => runValidationTasks("maxiDescription", maxiDescription)}
        errorMessage={errors.maxiDescription?.errorMessage}
        hasError={errors.maxiDescription?.hasError}
        {...getOverrideProps(overrides, "maxiDescription")}
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName: value,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName: value,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession: value,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber: value,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship: value,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress: value,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail: value,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN: value,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
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
        label="Guarantor nin image"
        isRequired={false}
        isReadOnly={false}
        value={guarantorNINImage}
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage: value,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
            };
            const result = onChange(modelFields);
            value = result?.guarantorNINImage ?? value;
          }
          if (errors.guarantorNINImage?.hasError) {
            runValidationTasks("guarantorNINImage", value);
          }
          setGuarantorNINImage(value);
        }}
        onBlur={() =>
          runValidationTasks("guarantorNINImage", guarantorNINImage)
        }
        errorMessage={errors.guarantorNINImage?.errorMessage}
        hasError={errors.guarantorNINImage?.hasError}
        {...getOverrideProps(overrides, "guarantorNINImage")}
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat: value,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng: value,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading: value,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token: value,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
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
      <SwitchField
        label="Is approved"
        defaultChecked={false}
        isDisabled={false}
        isChecked={isApproved}
        onChange={(e) => {
          let value = e.target.checked;
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved: value,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
            };
            const result = onChange(modelFields);
            value = result?.isApproved ?? value;
          }
          if (errors.isApproved?.hasError) {
            runValidationTasks("isApproved", value);
          }
          setIsApproved(value);
        }}
        onBlur={() => runValidationTasks("isApproved", isApproved)}
        errorMessage={errors.isApproved?.errorMessage}
        hasError={errors.isApproved?.hasError}
        {...getOverrideProps(overrides, "isApproved")}
      ></SwitchField>
      <TextField
        label="Approved by id"
        isRequired={false}
        isReadOnly={false}
        value={approvedById}
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById: value,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
            };
            const result = onChange(modelFields);
            value = result?.approvedById ?? value;
          }
          if (errors.approvedById?.hasError) {
            runValidationTasks("approvedById", value);
          }
          setApprovedById(value);
        }}
        onBlur={() => runValidationTasks("approvedById", approvedById)}
        errorMessage={errors.approvedById?.errorMessage}
        hasError={errors.approvedById?.hasError}
        {...getOverrideProps(overrides, "approvedById")}
      ></TextField>
      <TextField
        label="Current batch count"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={currentBatchCount}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount: value,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
            };
            const result = onChange(modelFields);
            value = result?.currentBatchCount ?? value;
          }
          if (errors.currentBatchCount?.hasError) {
            runValidationTasks("currentBatchCount", value);
          }
          setCurrentBatchCount(value);
        }}
        onBlur={() =>
          runValidationTasks("currentBatchCount", currentBatchCount)
        }
        errorMessage={errors.currentBatchCount?.errorMessage}
        hasError={errors.currentBatchCount?.hasError}
        {...getOverrideProps(overrides, "currentBatchCount")}
      ></TextField>
      <TextField
        label="Current express count"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={currentExpressCount}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount: value,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey,
            };
            const result = onChange(modelFields);
            value = result?.currentExpressCount ?? value;
          }
          if (errors.currentExpressCount?.hasError) {
            runValidationTasks("currentExpressCount", value);
          }
          setCurrentExpressCount(value);
        }}
        onBlur={() =>
          runValidationTasks("currentExpressCount", currentExpressCount)
        }
        errorMessage={errors.currentExpressCount?.errorMessage}
        hasError={errors.currentExpressCount?.hasError}
        {...getOverrideProps(overrides, "currentExpressCount")}
      ></TextField>
      <TextField
        label="Current maxi count"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={currentMaxiCount}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount: value,
              lastBatchAssignedAt,
              statusKey,
            };
            const result = onChange(modelFields);
            value = result?.currentMaxiCount ?? value;
          }
          if (errors.currentMaxiCount?.hasError) {
            runValidationTasks("currentMaxiCount", value);
          }
          setCurrentMaxiCount(value);
        }}
        onBlur={() => runValidationTasks("currentMaxiCount", currentMaxiCount)}
        errorMessage={errors.currentMaxiCount?.errorMessage}
        hasError={errors.currentMaxiCount?.hasError}
        {...getOverrideProps(overrides, "currentMaxiCount")}
      ></TextField>
      <TextField
        label="Last batch assigned at"
        isRequired={false}
        isReadOnly={false}
        type="datetime-local"
        value={
          lastBatchAssignedAt && convertToLocal(new Date(lastBatchAssignedAt))
        }
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : new Date(e.target.value).toISOString();
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt: value,
              statusKey,
            };
            const result = onChange(modelFields);
            value = result?.lastBatchAssignedAt ?? value;
          }
          if (errors.lastBatchAssignedAt?.hasError) {
            runValidationTasks("lastBatchAssignedAt", value);
          }
          setLastBatchAssignedAt(value);
        }}
        onBlur={() =>
          runValidationTasks("lastBatchAssignedAt", lastBatchAssignedAt)
        }
        errorMessage={errors.lastBatchAssignedAt?.errorMessage}
        hasError={errors.lastBatchAssignedAt?.hasError}
        {...getOverrideProps(overrides, "lastBatchAssignedAt")}
      ></TextField>
      <TextField
        label="Status key"
        isRequired={false}
        isReadOnly={false}
        value={statusKey}
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
              courierNINImage,
              bankCode,
              bankName,
              accountName,
              accountNumber,
              transportationType,
              vehicleClass,
              model,
              vehicleColour,
              plateNumber,
              maxiImages,
              maxiDescription,
              guarantorName,
              guarantorLastName,
              guarantorProfession,
              guarantorNumber,
              guarantorRelationship,
              guarantorAddress,
              guarantorEmail,
              guarantorNIN,
              guarantorNINImage,
              lat,
              lng,
              heading,
              push_token,
              isApproved,
              approvedById,
              currentBatchCount,
              currentExpressCount,
              currentMaxiCount,
              lastBatchAssignedAt,
              statusKey: value,
            };
            const result = onChange(modelFields);
            value = result?.statusKey ?? value;
          }
          if (errors.statusKey?.hasError) {
            runValidationTasks("statusKey", value);
          }
          setStatusKey(value);
        }}
        onBlur={() => runValidationTasks("statusKey", statusKey)}
        errorMessage={errors.statusKey?.errorMessage}
        hasError={errors.statusKey?.hasError}
        {...getOverrideProps(overrides, "statusKey")}
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
