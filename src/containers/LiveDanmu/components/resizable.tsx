import React, {forwardRef, useState} from "react";
import {Table} from "@arco-design/web-react";
import {Resizable} from 'react-resizable';


const CustomResizeHandle = forwardRef((props, ref) => {
    const {handleAxis, ...restProps} = props;
    return (
        <span
            ref={ref}
            className={`react-resizable-handle react-resizable-handle-${handleAxis}`}
            {...restProps}
            onClick={(e) => {
                e.stopPropagation();
            }}
        />
    );
});

const ResizableTitle = (props) => {
    const {onResize, width, ...restProps} = props;

    if (!width) {
        return <th {...restProps} />;
    }

    return (
        <Resizable
            width={width}
            height={0}
            handle={<CustomResizeHandle/>}
            onResize={onResize}
            draggableOpts={{
                enableUserSelectHack: false,
            }}
        >
            <th {...restProps} />
        </Resizable>
    );
};


export const components = {
    header: {
        th: ResizableTitle,
    },
};


interface ResizeAbelProps {
    tableOriginal: Record<string, any> // 组件库table原生支持的props,不包括columns和data
    columns:any[]
    data:any[]
}

export const ResizeAbel: React.FC = (props: ResizeAbelProps) => {
    const [Acolumns, setAcolumns] = useState(props.columns.map((column, index) => {
        if (column.width) {
            return {
                ...column,
                onHeaderCell: (col) => ({
                    width: col.width,
                    onResize: handleResize(index),
                }),
            };
        }
        return column;
    }))

    function handleResize(index) {
        return (e, {size}) => {
            setAcolumns((prevColumns) => {
                const nextColumns = [...prevColumns];
                nextColumns[index] = {...nextColumns[index], width: size.width};
                return nextColumns;
            });
        };
    }
    console.log(props.tableOriginal)
    return (
        <Table
            onRow={(record, index) => {
                return {
                    onContextMenu: (event) => {
                        console.log(123123, event, record)
                    },
                };
            }}
            className='table-demo-resizable-column'
            size='mini'
            virtualized
            scroll={{
                y: 300,
            }}
            border
            borderCell
            pagination={false}
            components={components}
            columns={Acolumns}
            data={props.data}
            {...props.tableOriginal}
        />
    )
}
