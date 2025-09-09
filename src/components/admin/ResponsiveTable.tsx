import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronRight, Eye, Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ResponsiveTableProps {
  title: string;
  description?: string;
  data: Array<Record<string, any>>;
  columns: Array<{
    key: string;
    label: string;
    render?: (value: any, row: Record<string, any>) => React.ReactNode;
  }>;
  actions?: Array<{
    label: string;
    icon: React.ComponentType<any>;
    onClick: (row: Record<string, any>) => void;
    variant?: 'default' | 'destructive' | 'outline';
  }>;
  onRowClick?: (row: Record<string, any>) => void;
  loading?: boolean;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  title,
  description,
  data,
  columns,
  actions,
  onRowClick,
  loading
}) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="space-y-2 mb-4">
            <div className="h-8 w-full bg-muted/50 rounded animate-pulse" />
            <div className="h-8 w-11/12 bg-muted/50 rounded animate-pulse" />
            <div className="h-8 w-10/12 bg-muted/50 rounded animate-pulse" />
          </div>
        )}
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key}>{column.label}</TableHead>
                ))}
                {actions && actions.length > 0 && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!loading ? data : Array.from({ length: 5 }, (_, i) => ({ __skeleton: i }))).map((row, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`hover:bg-muted/50 ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => !('__skeleton' in row) && onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {'__skeleton' in row ? (
                        <div className="h-4 w-3/4 bg-muted/50 rounded animate-pulse" />
                      ) : column.render 
                        ? column.render(row[column.key], row)
                        : row[column.key]
                      }
                    </TableCell>
                  ))}
                  {actions && actions.length > 0 && (
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        {!loading && actions.map((action, actionIndex) => {
                          const Icon = action.icon;
                          return (
                            <Button
                              key={actionIndex}
                              size="sm"
                              variant={action.variant || 'outline'}
                              onClick={(e) => {
                                e.stopPropagation();
                                action.onClick(row);
                              }}
                            >
                              <Icon className="h-3 w-3" />
                            </Button>
                          );
                        })}
                      </div>
                    </TableCell>
                  )}
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {(!loading ? data : Array.from({ length: 4 }, (_, i) => ({ __skeleton: i }))).map((row, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 border rounded-lg space-y-3 ${onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}`}
              onClick={() => !('__skeleton' in row) && onRowClick?.(row)}
            >
              {columns.map((column) => (
                <div key={column.key} className="grid grid-cols-3 gap-2 items-start">
                  <span className="col-span-1 text-xs font-medium text-muted-foreground">
                    {column.label}
                  </span>
                  <span className="col-span-2 text-sm font-semibold break-words">
                    {'__skeleton' in row ? (
                      <div className="h-4 w-5/6 bg-muted/50 rounded animate-pulse" />
                    ) : column.render 
                      ? column.render(row[column.key], row)
                      : row[column.key]
                    }
                  </span>
                </div>
              ))}
              
              {actions && actions.length > 0 && (
                <div className="flex gap-2 pt-2 border-t">
                  {!loading && actions.map((action, actionIndex) => {
                    const Icon = action.icon;
                    return (
                      <Button
                        key={actionIndex}
                        size="sm"
                        variant={action.variant || 'outline'}
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          action.onClick(row);
                        }}
                      >
                        <Icon className="h-3 w-3 mr-1" />
                        {action.label}
                      </Button>
                    );
                  })}
                </div>
              )}
              
              {onRowClick && (
                <div className="flex justify-end pt-2">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {!loading && data.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};