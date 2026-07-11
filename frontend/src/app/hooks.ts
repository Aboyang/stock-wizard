import { useDispatch, useSelector } from "react-redux"
import type { TAppDispatch, TRootState } from "./store"

// pre-typed react-redux hooks — use these instead of plain useDispatch/useSelector
export const useAppDispatch = useDispatch.withTypes<TAppDispatch>()
export const useAppSelector = useSelector.withTypes<TRootState>()
