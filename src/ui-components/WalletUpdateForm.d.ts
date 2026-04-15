/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, SelectFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
import { Wallet } from "../models";
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
export declare type WalletUpdateFormInputValues = {
    ownerID?: string;
    ownerType?: string;
    balance?: number;
    pendingBalance?: number;
    totalEarnings?: number;
};
export declare type WalletUpdateFormValidationValues = {
    ownerID?: ValidationFunction<string>;
    ownerType?: ValidationFunction<string>;
    balance?: ValidationFunction<number>;
    pendingBalance?: ValidationFunction<number>;
    totalEarnings?: ValidationFunction<number>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type WalletUpdateFormOverridesProps = {
    WalletUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    ownerID?: PrimitiveOverrideProps<TextFieldProps>;
    ownerType?: PrimitiveOverrideProps<SelectFieldProps>;
    balance?: PrimitiveOverrideProps<TextFieldProps>;
    pendingBalance?: PrimitiveOverrideProps<TextFieldProps>;
    totalEarnings?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type WalletUpdateFormProps = React.PropsWithChildren<{
    overrides?: WalletUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    wallet?: Wallet;
    onSubmit?: (fields: WalletUpdateFormInputValues) => WalletUpdateFormInputValues;
    onSuccess?: (fields: WalletUpdateFormInputValues) => void;
    onError?: (fields: WalletUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: WalletUpdateFormInputValues) => WalletUpdateFormInputValues;
    onValidate?: WalletUpdateFormValidationValues;
} & React.CSSProperties>;
export default function WalletUpdateForm(props: WalletUpdateFormProps): React.ReactElement;
