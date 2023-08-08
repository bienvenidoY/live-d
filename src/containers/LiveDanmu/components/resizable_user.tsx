import React, {forwardRef, useState} from "react";
import {Table} from "@arco-design/web-react";
import {Resizable} from 'react-resizable';
import {MenuListType, openRightMenu} from './rightMenu'
import {ConnectEnum} from "@/containers/LiveDanmu";



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
    openRightMenu: (menuItem: MenuListType, record) => void;
    rowMap:Record<string, (event:any)=>void>
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
    return (
        <Table
            onRow={(record, index) => {
                return {
                    onContextMenu: (event) => {
                        // openRightMenu(event.clientX,event.clientY, record, (menuItem) => {
                        //     console.log('右键点击事件',menuItem, record)
                        //     props.openRightMenu(menuItem, {...record, index})
                        // })
                        console.log('右键')
                    },
                    onClick:()=>{
                        props.rowMap.onClick(record)
                    }
                };
            }}
            rowClassName={(record) => {
                if(record.connectStatus === ConnectEnum['正在抓取']) {
                    return 'is-connecting'
                }
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
