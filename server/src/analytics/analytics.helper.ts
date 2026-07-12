// shared shapes used by every analytics domain

// dates are ISO strings when posted from the client, Date objects when built server-side
export interface IDataPoint {
    date: Date | string
    price: number
}

export interface IRatePoint {
    date: Date | string
    rate: number
}
