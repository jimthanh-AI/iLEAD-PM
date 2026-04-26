import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { FileText, MoreVertical, Calendar } from 'lucide-react';
import { useData } from '../context/DataContext';
import { ProjectForm } from './forms/ProjectForm';
import { Trash2 } from 'lucide-react';
import './KanbanBoard.css';

const STATUSES = ['not_started', 'in_progress', 'done', 'not_completed'];
const STATUS_LABELS = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  done: 'Done',
  not_completed: 'Not Completed',
};
const STATUS_COLORS = {
  not_started: '#9ca3af',
  in_progress: '#2563eb',
  done: '#10b981',
  not_completed: '#ef4444',
};

export const KanbanBoard = ({ projects, defaultPartnerId = null }) => {
  const { setData, activities, deleteProject } = useData();
  const [modalState, setModalState] = React.useState({ isOpen: false, projectId: null, initialStatus: 'not_started' });

  const openForm = (projectId = null, initialStatus = 'not_started') => {
    setModalState({ isOpen: true, projectId, initialStatus });
  };

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Moving project to a new status
    setData((prev) => {
      const allProjects = [...prev.projects];
      const projectIndex = allProjects.findIndex((p) => p.id === draggableId);
      
      if (projectIndex === -1) return prev;

      const project = allProjects[projectIndex];
      const newStatus = destination.droppableId;

      // Create updated array
      const updatedProjects = allProjects.map(p => {
        if (p.id === draggableId) {
          return { ...p, status: newStatus };
        }
        return p;
      });

      return { ...prev, projects: updatedProjects };
    });
  };

  const projectsByStatus = STATUSES.reduce((acc, status) => {
    acc[status] = projects.filter((p) => p.status === status) || [];
    return acc;
  }, {});

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="kanban-board">
        {STATUSES.map((status) => (
          <div key={status} className="kanban-col glass">
            <div className="k-col-hdr">
              <div className="k-col-dot" style={{ backgroundColor: STATUS_COLORS[status] }}></div>
              <span className="k-col-title">{STATUS_LABELS[status]}</span>
              <span className="k-col-cnt">{projectsByStatus[status].length}</span>
            </div>

            <Droppable droppableId={status}>
              {(provided, snapshot) => (
                <div
                  className={`k-cards ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {projectsByStatus[status].map((project, index) => {
                    const actCount = activities.filter((a) => a.projectId === project.id).length;
                    
                    return (
                      <Draggable key={project.id} draggableId={project.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            className={`proj-card glass-card ${snapshot.isDragging ? 'dragging' : ''}`}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                            }}
                          >
                            <div className="proj-card-top">
                              <FileText size={16} className="text-muted" />
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button className="btn-icon" onClick={() => openForm(project.id)} title="Edit"><MoreVertical size={14}/></button>
                                <button className="btn-icon danger-icon" onClick={(e) => { e.stopPropagation(); if(confirm('Delete project?')) deleteProject(project.id); }} title="Delete"><Trash2 size={14} color="var(--red)"/></button>
                              </div>
                            </div>
                            <div className="proj-card-name" onClick={() => openForm(project.id)} style={{cursor: 'pointer'}}>{project.name}</div>
                            {project.subCode && (
                              <div className="proj-card-tags">
                                <span className="tag">{project.subCode}</span>
                              </div>
                            )}
                            <div className="proj-card-foot">
                              <span>{actCount} activities</span>
                              {project.endDate && (
                                <span className="due-date">
                                  <Calendar size={12} /> {project.endDate}
                                </span>
                              )}
                            </div>
                            {project.author && (
                              <div style={{ fontSize: '10px', color: 'var(--text3)', textAlign: 'right', marginTop: '6px' }}>
                                Tạo bởi: {project.author}
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
            
            <div className="k-add">
              <button className="btn k-add-btn" onClick={() => openForm(null, status)}>+ Add Project</button>
            </div>
          </div>
        ))}
      </div>

      <ProjectForm 
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        projectId={modalState.projectId}
        initialStatus={modalState.initialStatus}
      />
    </DragDropContext>
  );
};
