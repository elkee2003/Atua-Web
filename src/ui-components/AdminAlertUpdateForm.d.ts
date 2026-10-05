/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, SelectFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
import { AdminAlert } from "../models";
export declare type EscapeHatchProps = {
    [elementHierarchy: string]: Record<string, unknown>;
} | null;
export declare type VariantValues = {
    [key: string]: string;
};
export declare type Variant = {
    variantValues: VariantValues;
    overrides: EscapeHatchProps;
};
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type AdminAlertUpdateFormInputValues = {
    type?: string;
    title?: string;
    message?: string;
    severity?: string;
    status?: string;
    payoutID?: string;
    payoutMethod?: string;
    payoutSource?: string;
    courierID?: string;
    amount?: number;
    courierObligations?: number;
    paystackCosts?: number;
    totalRequired?: number;
    paystackBalance?: number;
    topUpRequired?: number;
    affectedCourierCount?: number;
    createdAt?: string;
    readAt?: string;
    resolvedAt?: string;
};
export declare type AdminAlertUpdateFormValidationValues = {
    type?: ValidationFunction<string>;
    title?: ValidationFunction<string>;
    message?: ValidationFunction<string>;
    severity?: ValidationFunction<string>;
    status?: ValidationFunction<string>;
    payoutID?: ValidationFunction<string>;
    payoutMethod?: ValidationFunction<string>;
    payoutSource?: ValidationFunction<string>;
    courierID?: ValidationFunction<string>;
    amount?: ValidationFunction<number>;
    courierObligations?: ValidationFunction<number>;
    paystackCosts?: ValidationFunction<number>;
    totalRequired?: ValidationFunction<number>;
    paystackBalance?: ValidationFunction<number>;
    topUpRequired?: ValidationFunction<number>;
    affectedCourierCount?: ValidationFunction<number>;
    createdAt?: ValidationFunction<string>;
    readAt?: ValidationFunction<string>;
    resolvedAt?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type AdminAlertUpdateFormOverridesProps = {
    AdminAlertUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    type?: PrimitiveOverrideProps<TextFieldProps>;
    title?: PrimitiveOverrideProps<TextFieldProps>;
    message?: PrimitiveOverrideProps<TextFieldProps>;
    severity?: PrimitiveOverrideProps<TextFieldProps>;
    status?: PrimitiveOverrideProps<TextFieldProps>;
    payoutID?: PrimitiveOverrideProps<TextFieldProps>;
    payoutMethod?: PrimitiveOverrideProps<TextFieldProps>;
    payoutSource?: PrimitiveOverrideProps<SelectFieldProps>;
    courierID?: PrimitiveOverrideProps<TextFieldProps>;
    amount?: PrimitiveOverrideProps<TextFieldProps>;
    courierObligations?: PrimitiveOverrideProps<TextFieldProps>;
    paystackCosts?: PrimitiveOverrideProps<TextFieldProps>;
    totalRequired?: PrimitiveOverrideProps<TextFieldProps>;
    paystackBalance?: PrimitiveOverrideProps<TextFieldProps>;
    topUpRequired?: PrimitiveOverrideProps<TextFieldProps>;
    affectedCourierCount?: PrimitiveOverrideProps<TextFieldProps>;
    createdAt?: PrimitiveOverrideProps<TextFieldProps>;
    readAt?: PrimitiveOverrideProps<TextFieldProps>;
    resolvedAt?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type AdminAlertUpdateFormProps = React.PropsWithChildren<{
    overrides?: AdminAlertUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    adminAlert?: AdminAlert;
    onSubmit?: (fields: AdminAlertUpdateFormInputValues) => AdminAlertUpdateFormInputValues;
    onSuccess?: (fields: AdminAlertUpdateFormInputValues) => void;
    onError?: (fields: AdminAlertUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: AdminAlertUpdateFormInputValues) => AdminAlertUpdateFormInputValues;
    onValidate?: AdminAlertUpdateFormValidationValues;
} & React.CSSProperties>;
export default function AdminAlertUpdateForm(props: AdminAlertUpdateFormProps): React.ReactElement;
